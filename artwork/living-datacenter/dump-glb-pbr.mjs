/**
 * Dump de factores PBR de un GLB (chunk JSON del contenedor binario) —
 * sin dependencias: header 12 bytes, luego chunks (JSON + BIN).
 * Uso: node dump-glb-pbr.mjs <file.glb> [<file2.glb> ...]
 */
import fs from 'node:fs';

function parseGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('no GLB: ' + file);
  let off = 12;
  let json = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const chunk = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) { json = JSON.parse(chunk.toString('utf8')); break; }
    off += 8 + len;
  }
  if (!json) throw new Error('sin chunk JSON: ' + file);
  return json;
}

for (const file of process.argv.slice(2)) {
  console.log('=== ' + file + ' ===');
  const json = parseGLB(file);
  const mats = (json.materials || []).map((m, i) => {
    const pbr = m.pbrMetallicRoughness || {};
    return {
      i,
      name: m.name || '(sin nombre)',
      baseColor: pbr.baseColorFactor ? pbr.baseColorFactor.slice(0, 3).map((v) => +(v * 255).toFixed(0)) : null,
      metalness: pbr.metallicFactor,
      roughness: pbr.roughnessFactor,
      hasBaseTex: !!pbr.baseColorTexture,
      alphaMode: m.alphaMode || 'OPAQUE',
      doubleSided: !!m.doubleSided,
    };
  });
  if (!mats.length) console.log('  sin materials');
  for (const m of mats) {
    console.log(
      `  [${m.i}] ${m.name}\n       base=${JSON.stringify(m.baseColor)} metal=${m.metalness} rough=${m.roughness} tex=${m.hasBaseTex} alpha=${m.alphaMode} dbl=${m.doubleSided}`,
    );
  }
  // Qué meshes usan cada material (para el bridge por nombre de mesh)
  const meshByMat = {};
  for (const n of json.nodes || []) {
    if (n.mesh === undefined) continue;
    const prims = (json.meshes?.[n.mesh]?.primitives) || [];
    for (const p of prims) {
      const mIdx = p.material;
      if (mIdx === undefined) continue;
      (meshByMat[mIdx] ||= []).push(n.name || `node#${n.mesh}`);
    }
  }
  for (const [mi, names] of Object.entries(meshByMat)) {
    console.log(`  material[${mi}] → meshes: ${names.join(', ')}`);
  }
}
