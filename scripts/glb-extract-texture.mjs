#!/usr/bin/env node
/**
 * glb-extract-texture — Bridge CSP (ASSET-PIPELINE.md §4).
 *
 * Los outputs de Meshy/Tripo embeben la textura en el buffer del GLB
 * (bufferView + mimeType). GLTFLoader la decodifica via `blob:` URL, que la
 * CSP del sitio bloquea (`img-src 'self' data: https:` — sin blob:). En lugar
 * de relajar la CSP (SPEC §27), este script extrae la imagen a un archivo
 * separado y re-escribe el GLB con `images[0].uri` RELATIVO al GLB.
 *
 * Uso:
 *   node scripts/glb-extract-texture.mjs <archivo.glb>
 *
 * Detecta la(s) imagen(es) por bufferView, las escribe como
 * `<glb-sin-ext>_tex.<ext>` junto al GLB, reindexa bufferViews/accessors y
 * ajusta los byteOffsets de EXT_meshopt_compression.
 */
import fs from "node:fs";
import path from "node:path";

const [, , arg] = process.argv;
if (!arg) {
  console.error("Uso: node scripts/glb-extract-texture.mjs <archivo.glb>");
  process.exit(1);
}
const src = path.resolve(arg);
const buf = fs.readFileSync(src);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));

const images = json.images ?? [];
const imageBvs = images.map((im) => im.bufferView).filter((i) => i !== undefined);
if (imageBvs.length === 0) {
  console.log("ℹ️  Sin imágenes embebidas en el GLB — nada que extraer.");
  process.exit(0);
}

// GLB: header(12) + JSON chunk + BIN chunk
const binStart = 20 + jsonLen + 8;
const binLen = buf.length - binStart;
const bin = buf.slice(binStart, binStart + binLen);

let totalTrim = 0;
for (const img of images) {
  if (img.bufferView === undefined) continue;
  const bv = json.bufferViews[img.bufferView];
  const data = bin.slice(bv.byteOffset, bv.byteOffset + bv.byteLength);
  let ext = (img.mimeType || "").split("/")[1] || "bin";
  if (ext === "jpeg") ext = "jpg"; // normalizar image/jpeg -> .jpg
  const outName = path.basename(src, ".glb") + "_tex." + ext;
  fs.writeFileSync(path.join(path.dirname(src), outName), data);
  console.log(`✓ textura ${bv.byteLength} B → ${outName}`);
  delete img.bufferView;
  delete img.mimeType;
  img.uri = outName; // RELATIVO — absoluto se duplica contra el resourcePath del loader
  totalTrim += bv.byteLength;
}

// Reindexar bufferViews: las de imágenes se eliminan; el resto baja de índice.
const imageBvSet = new Set(imageBvs);
const idxMap = new Map();
let cursor = 0;
for (let i = 0; i < json.bufferViews.length; i++) {
  if (!imageBvSet.has(i)) idxMap.set(i, cursor++);
}
json.bufferViews = json.bufferViews.filter((_, i) => !imageBvSet.has(i));

for (const acc of json.accessors) {
  if (acc.bufferView !== undefined) acc.bufferView = idxMap.get(acc.bufferView);
}
// meshopt: byteOffsets sobre el buffer 0 se corren hacia atrás por el total extraído
for (const bv of json.bufferViews) {
  const ext = bv.extensions?.EXT_meshopt_compression;
  if (ext && ext.buffer === 0) ext.byteOffset -= totalTrim;
}
json.buffers[0].byteLength = binLen - totalTrim;

const jsonStr = JSON.stringify(json);
const padded = jsonStr.length % 4 === 0 ? jsonStr : jsonStr + " ".repeat(4 - (jsonStr.length % 4));
const newBin = bin.slice(totalTrim);
const out = Buffer.alloc(12 + 8 + padded.length + 8 + newBin.length);
out.write("glTF", 0, "ascii");
out.writeUInt32LE(2, 4);
out.writeUInt32LE(out.length, 8);
out.writeUInt32LE(padded.length, 12);
out.write("JSON", 16, "ascii");
out.write(padded, 20, "ascii");
out.writeUInt32LE(newBin.length, 20 + padded.length);
out.write("BIN\0", 24 + padded.length, "ascii");
newBin.copy(out, 28 + padded.length);
fs.writeFileSync(src, out);
console.log(`✓ GLB reescrito: ${(out.length / 1024).toFixed(0)} KB (antes ${(buf.length / 1024).toFixed(0)} KB)`);
