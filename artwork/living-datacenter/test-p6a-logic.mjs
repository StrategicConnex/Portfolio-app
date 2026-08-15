/**
 * Valida la lógica pura del split P6a (blender-p6a-split.py) sin Blender:
 * 1. Colección de islas UV por conectividad de borde (componentes conexas).
 * 2. Filtros de región: banda espacial (axis/axis_range) y rango de islas UV.
 *
 * Mesh sintético: 2 caras cuadradas (4 tris) en islas UV SEPARADAS
 * (A: u[0.0-0.25], B: u[0.5-0.75]) — replica el caso Tripo donde el mesh es
 * watertight pero cada región tiene su isla.
 */
import assert from 'node:assert/strict';

// ---- réplica de collect_islands (grafos por borde UV) ----------------------
function collectIslands(uvs, polys) {
  // uvs: Float-like array [{u,v} por loop]; polys: [{start, total, verts}]
  const edgeToFaces = new Map();
  for (let fi = 0; fi < polys.length; fi++) {
    const p = polys[fi];
    for (let k = 0; k < p.total; k++) {
      const li = p.start + k;
      const nli = p.start + ((k + 1) % p.total);
      let key = [uvs[li].u, uvs[li].v, uvs[nli].u, uvs[nli].v].join(',');
      const rev = [uvs[nli].u, uvs[nli].v, uvs[li].u, uvs[li].v].join(',');
      if (rev < key) key = rev;
      if (!edgeToFaces.has(key)) edgeToFaces.set(key, []);
      edgeToFaces.get(key).push(fi);
    }
  }
  const visited = new Set();
  const islands = [];
  for (let fi = 0; fi < polys.length; fi++) {
    if (visited.has(fi)) continue;
    const stack = [fi];
    visited.add(fi);
    const comp = [];
    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      const p = polys[cur];
      for (let k = 0; k < p.total; k++) {
        const li = p.start + k;
        const nli = p.start + ((k + 1) % p.total);
        let key = [uvs[li].u, uvs[li].v, uvs[nli].u, uvs[nli].v].join(',');
        const rev = [uvs[nli].u, uvs[nli].v, uvs[li].u, uvs[li].v].join(',');
        if (rev < key) key = rev;
        for (const nf of edgeToFaces.get(key) || []) {
          if (!visited.has(nf)) { visited.add(nf); stack.push(nf); }
        }
      }
    }
    islands.push(comp);
  }
  return islands;
}

// ---- réplica de los filtros de región --------------------------------------
function islandBounds(uvs, poly) {
  let minU = 1e9, minV = 1e9, maxU = -1e9, maxV = -1e9;
  for (let k = 0; k < poly.total; k++) {
    const uv = uvs[poly.start + k];
    minU = Math.min(minU, uv.u); minV = Math.min(minV, uv.v);
    maxU = Math.max(maxU, uv.u); maxV = Math.max(maxV, uv.v);
  }
  return [minU, minV, maxU, maxV];
}

function axisOk(axis, range, centroid) {
  if (axis == null || range == null || centroid == null) return true;
  const v = centroid[axis];
  return v >= range[0] && v <= range[1];
}

// ---- mesh sintético --------------------------------------------------------
// 8 vértices: 4 por isla (dos quads). Isla A (door) en UV [0,0.25] y z=1.2;
// isla B (plinth) en UV [0.5,0.75] y y=0.05. UVs de quad reales (esquinas sin
// degenerar). Centroides derivados de las posiciones 3D, como en Blender.
const quadUV = (ox, oy, z, y) => [
  { u: ox, v: oy, pos: { x: 0, y, z } },
  { u: ox + 0.25, v: oy, pos: { x: 1, y, z } },
  { u: ox + 0.25, v: oy + 0.25, pos: { x: 1, y: y + 0.1, z } },
  { u: ox, v: oy + 0.25, pos: { x: 0, y: y + 0.1, z } },
];
const uvs = [...quadUV(0, 0, 1.2, 1), ...quadUV(0.5, 0, 0.05, 0)];
const centroid = (p) => {
  let x = 0, y = 0, z = 0;
  for (let k = 0; k < p.total; k++) {
    const pos = uvs[p.start + k].pos;
    x += pos.x; y += pos.y; z += pos.z;
  }
  return { x: x / p.total, y: y / p.total, z: z / p.total };
};
const polys = [
  { start: 0, total: 4, verts: [0, 1, 3, 2] },  // isla A — banda z 0.15-2.4 (door)
  { start: 4, total: 4, verts: [4, 5, 7, 6] }, // isla B — banda y 0-0.15 (plinth)
];
polys.forEach((p) => { p.centroid = centroid(p); });

const islands = collectIslands(uvs, polys);
assert.equal(islands.length, 2, 'debe haber 2 islas UV');

const [isoA, isoB] = islands.map((comp) => ({
  comp,
  bounds: islandBounds(uvs, polys[comp[0]]),
  centroid: polys[comp[0]].centroid,
}));
assert.deepEqual(isoA.bounds, [0, 0, 0.25, 0.25], 'isla A en UV [0-0.25]');
assert.deepEqual(isoB.bounds, [0.5, 0, 0.75, 0.25], 'isla B en UV [0.5-0.75]');

// Filtro tipo RACK_REGIONS.door (axis Z, rango 0.15-2.4) → solo isla A
const doorMatch = islands.filter((comp) => {
  const p = polys[comp[0]];
  return axisOk('z', [0.15, 2.4], p.centroid);
});
assert.equal(doorMatch.length, 1, 'door aísla solo la isla A');

// Filtro tipo RACK_REGIONS.plinth (axis Y, rango 0-0.15) → solo isla B
const plinthMatch = islands.filter((comp) => {
  const p = polys[comp[0]];
  return axisOk('y', [0, 0.15], p.centroid);
});
assert.equal(plinthMatch.length, 1, 'plinth aísla solo la isla B');

// Filtro sin axis (LEDs, optional) → no matchea por banda → queda en chassis
const ledsMatch = islands.filter((comp) => {
  const p = polys[comp[0]];
  return axisOk(null, null, p.centroid);
});
assert.equal(ledsMatch.length, 2, 'sin filtro, ambas islas califican (pero LEDs es optional y requiere uv_bounds)');

// uv_bounds: isla B no cabe en un rango dedicado a LEDs → se descarta
const ledsFinal = islands.filter((comp) => {
  const p = polys[comp[0]];
  const b = islandBounds(uvs, p);
  return axisOk(null, null, p.centroid) && b[0] >= 0.9; // rango UV dedicado alto
});
assert.equal(ledsFinal.length, 0, 'LEDs sin isla UV dedicada → no se corta a ciegas');

console.log('P6A-LOGIC-OK: 2 islas · door→A · plinth→B · LEDs no aislable → queda en chassis (regla de seguridad OK)');
