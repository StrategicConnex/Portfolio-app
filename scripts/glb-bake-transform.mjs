import fs from "fs";

/**
 * Hornea el fit al slot en el nodo raíz de un GLB (origen-en-base), sin
 * re-encodear buffers — compatible con GLBs meshopt de Tripo cuyo nodo raíz
 * tiene scale/translation descompuestos sobre un mesh centro-anclado.
 *
 * ASSET-PIPELINE §5: los GLB entran al pipeline con origen-en-base y
 * proporciones del slot; el runtime NO escala por asset (solo el GlbAsset del
 * storage fallback mantiene su convención por slot).
 *
 * Uso:
 *   node scripts/glb-bake-transform.mjs <glb> <slotW> <slotH> <slotD> <nativeW> <nativeH> <nativeD> [minY]
 *
 *   minY: Y mínima del mesh nativo (default: −nativeH/2, centro-anclado).
 *   Ej. rack hero (nativo 0.65×0.998×0.381 → slot 1.0×2.4×0.9):
 *   node scripts/glb-bake-transform.mjs public/assets/3d/server_rack_v03.glb 1.0 2.4 0.9 0.65 0.998 0.381 -0.499
 */
const [SRC, sW, sH, sD, nW, nH, nD, minYArg] = process.argv.slice(2);
if (!SRC || !sW || !sH || !sD || !nW || !nH || !nD) {
  console.error("uso: node glb-bake-transform.mjs <glb> <slotW> <slotH> <slotD> <nativeW> <nativeH> <nativeD> [minY]");
  process.exit(1);
}
const slot = { w: parseFloat(sW), h: parseFloat(sH), d: parseFloat(sD) };
const native = { w: parseFloat(nW), h: parseFloat(nH), d: parseFloat(nD) };
const minY = minYArg !== undefined ? parseFloat(minYArg) : -native.h / 2;

const buf = fs.readFileSync(SRC);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
const node = json.nodes[0];
node.scale = [slot.w / native.w, slot.h / native.h, slot.d / native.d];
node.translation = [0, -minY * (slot.h / native.h), 0]; // eleva para que el min Y escalado quede en y=0
console.log("node:", JSON.stringify(node));

const binLen = buf.length - 20 - jsonLen - 8;
const binStart = 20 + jsonLen + 8;
const bin = buf.slice(binStart, binStart + binLen);
const jsonStr = JSON.stringify(json);
const padded = jsonStr.length % 4 === 0 ? jsonStr : jsonStr + " ".repeat(4 - (jsonStr.length % 4));

const out = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length);
out.write("glTF", 0, "ascii");
out.writeUInt32LE(2, 4);
out.writeUInt32LE(12 + 8 + padded.length + 8 + bin.length, 8);
out.writeUInt32LE(padded.length, 12);
out.write("JSON", 16, "ascii");
out.write(padded, 20, "ascii");
out.writeUInt32LE(bin.length, 20 + padded.length);
out.write("BIN\0", 24 + padded.length, "ascii");
bin.copy(out, 28 + padded.length);
fs.writeFileSync(SRC, out);
console.log("baked:", (out.length / 1024).toFixed(0), "KB");
console.log(`expected final size: ${slot.w} x ${slot.h} x ${slot.d}, base y=0`);
