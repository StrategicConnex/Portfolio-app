"""
P6a — Split canónico de los GLBs Tripo (REBAKE-PLAN-P6 §3-§4).

Divide el mesh único `tripo_node_*` en los meshes canónicos que el bridge
runtime (GlbMesh.tsx + datacenter.materials.ts) espera, conservando el albedo
horneado como Base Color y asignando los factores PBR del contrato por región.

Uso (Blender headless, desde la raíz del repo):
    blender --background --factory-startup \
      --python artwork/living-datacenter/blender-p6a-split.py -- \
      --asset rack --input public/assets/3d/server_rack_v03.glb \
      --tex artwork/living-datacenter/meshy-kit/04-rack/raw/server_rack_v03_tex-src.jpg \
      --out public/assets/3d/server_rack_v04.glb --dry-run

    --asset rack | storage
    --dry-run   imprime el plan (islas UV detectadas + regiones a separar) SIN
                modificar nada. Usado para inspeccionar el GLB antes de cortar.

Salida: el GLB versionado con meshes canónicos + 1 material Principled por
región con el albedo compartido y metal/rough del contrato (ASSET-PIPELINE §4,
REBAKE-PLAN-P6 §4). Cero emission, cero cámaras/luces/animaciones/empties.

Verificación pre-promoción (después del export, fuera de Blender):
    node artwork/living-datacenter/dump-glb-pbr.mjs <out.glb>
  Criterio PASS (REBAKE-PLAN-P6 §5.4):
    - cero meshes `tripo_node_*`
    - metal/rough por contrato por región
    - nº de materiales = nº de regiones (chassis vs door vs leds separados)
"""
import argparse
import bpy
import mathutils


# ---------------------------------------------------------------------------
# Contrato de regiones (REBAKE-PLAN-P6 §4).
# `axis`/`axis_range` = filtro espacial OPCIONAL (banda del centroide en el eje
# del espacio objeto). `uv_bounds` = rango [u0,v0,u1,v1] que acota las islas de
# la región en el UV editor. Si una región no se puede aislar con los filtros
# configurados, el script lo reporta y deja esa geometría en `chassis` — NUNCA
# corta a ciegas. Ajustá los filtros con el diagnóstico del --dry-run.
# ---------------------------------------------------------------------------

RACK_REGIONS = [
    {
        "name": "plinth",
        "axis": "Y",
        "axis_range": (0.0, 0.15),          # base del rack (origen en base y=0)
        "uv_bounds": None,
        "pbr": {"metallic": 0.7, "roughness": 0.5},
    },
    {
        "name": "door",
        "axis": "Z",                        # cara frontal del rack (sin plinto)
        "axis_range": (0.15, 2.4),
        "uv_bounds": None,
        "pbr": {"metallic": 0.7, "roughness": 0.5},
        "double_sided": True,               # el bridge AR2580 es DoubleSide
    },
    {
        "name": "leds_power",
        "axis": None,
        "axis_range": None,
        "uv_bounds": None,                  # requiere islas UV dedicadas
        "pbr": {"metallic": 0.3, "roughness": 0.6, "black_base": True},
        "optional": True,
    },
    {
        "name": "leds_status",
        "axis": None,
        "axis_range": None,
        "uv_bounds": None,
        "pbr": {"metallic": 0.3, "roughness": 0.6, "black_base": True},
        "optional": True,
    },
]

STORAGE_REGIONS = [
    {
        "name": "bezel_slats",
        "axis": "Z",                        # cara frontal rebajada (sin plinto)
        "axis_range": (0.05, 0.95),
        "uv_bounds": None,
        "pbr": {"metallic": 0.9, "roughness": 0.35},
        "double_sided": False,
    },
    {
        "name": "leds_lcd",
        "axis": None,
        "axis_range": None,
        "uv_bounds": None,
        "pbr": {"metallic": 0.3, "roughness": 0.6, "black_base": True},
        "optional": True,
    },
    {
        "name": "leds_status",
        "axis": None,
        "axis_range": None,
        "uv_bounds": None,
        "pbr": {"metallic": 0.3, "roughness": 0.6, "black_base": True},
        "optional": True,
    },
    {
        "name": "rear_controllers",
        "axis": "Y",                        # trasera del storage (y<0 tras base y=0)
        "axis_range": (-10.0, -0.05),
        "uv_bounds": None,
        "pbr": {"metallic": 0.0, "roughness": 0.8},
        "optional": True,
    },
]

CHASSIS_PBR = {
    "rack": {"metallic": 0.7, "roughness": 0.5},
    "storage": {"metallic": 0.85, "roughness": 0.4},
}


def report(msg):
    print("[P6a] " + msg)


def find_tripo_mesh():
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    for o in meshes:
        if o.name.startswith("tripo_node_"):
            return o
    if len(meshes) == 1:
        report("AVISO: no hay prefijo tripo_node_; uso el único mesh: " + meshes[0].name)
        return meshes[0]
    report("ERROR: no encontré mesh tripo_node_ (encontré %d meshes)" % len(meshes))
    return None


def island_bounds(obj, island_faces):
    uv_layer = obj.data.uv_layers[0]
    min_u = min_v = 1e9
    max_u = max_v = -1e9
    for f in island_faces:
        for li in range(f.loop_start, f.loop_start + f.loop_total):
            uv = uv_layer.data[li].uv
            min_u = min(min_u, uv.x)
            max_u = max(max_u, uv.x)
            min_v = min(min_v, uv.y)
            max_v = max(max_v, uv.y)
    return (min_u, min_v, max_u, max_v)


def island_centroid_3d(obj, island_faces):
    verts = obj.data.vertices
    vset = set()
    for f in island_faces:
        for vi in f.vertices:
            vset.add(vi)
    if not vset:
        return None
    c = mathutils.Vector((0.0, 0.0, 0.0))
    for vi in vset:
        c += verts[vi].co
    return c / len(vset)


def axis_ok(axis, axis_range, centroid):
    if axis is None or axis_range is None or centroid is None:
        return True
    v = getattr(centroid, axis)
    lo, hi = axis_range
    return lo <= v <= hi


def uv_bounds_ok(uv_bounds, bounds):
    u0, v0, u1, v1 = bounds
    ru0, rv0, ru1, rv1 = uv_bounds
    return u0 >= ru0 - 1e-4 and v0 >= rv0 - 1e-4 and u1 <= ru1 + 1e-4 and v1 <= rv1 + 1e-4


def collect_islands(obj):
    """Listas de caras por isla UV (componentes conexas por borde UV)."""
    me = obj.data
    uv_layer = me.uv_layers[0]
    faces = list(me.polygons)

    edge_to_faces = {}
    for f in faces:
        for li in range(f.loop_start, f.loop_start + f.loop_total):
            nxt = li + 1 if li + 1 < f.loop_start + f.loop_total else f.loop_start
            key = (tuple(uv_layer.data[li].uv), tuple(uv_layer.data[nxt].uv))
            key = key if key[0] <= key[1] else (key[1], key[0])
            edge_to_faces.setdefault(key, []).append(f.index)

    visited = set()
    islands = []
    for f in faces:
        if f.index in visited:
            continue
        stack = [f.index]
        comp = []
        visited.add(f.index)
        while stack:
            fi = stack.pop()
            comp.append(fi)
            f = faces[fi]
            for li in range(f.loop_start, f.loop_start + f.loop_total):
                nxt = li + 1 if li + 1 < f.loop_start + f.loop_total else f.loop_start
                key = (tuple(uv_layer.data[li].uv), tuple(uv_layer.data[nxt].uv))
                key = key if key[0] <= key[1] else (key[1], key[0])
                for nf in edge_to_faces.get(key, []):
                    if nf not in visited:
                        visited.add(nf)
                        stack.append(nf)
        islands.append([faces[i] for i in comp])
    return islands


def select_and_separate(obj, face_idx, new_name):
    """Selecciona las caras y las separa a un objeto nuevo. Devuelve el objeto nuevo o None."""
    before = set(o.name for o in bpy.data.objects if o.type == "MESH")
    me = obj.data
    for f in me.polygons:
        f.select = f.index in face_idx
    me.update_tag()
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.separate(type="SELECTED")
    bpy.ops.object.mode_set(mode="OBJECT")
    for o in bpy.data.objects:
        if o.type == "MESH" and o.name not in before:
            o.name = new_name
            return o
    report("ERROR: separate no produjo objeto nuevo (%s)" % new_name)
    return None


def make_material(name, img, pbr, double_sided=False):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = pbr.get("metallic", 0.0)
    bsdf.inputs["Roughness"].default_value = pbr.get("roughness", 0.9)
    if pbr.get("black_base"):
        # LEDs: baseColor apagado — el runtime les asigna el emisivo por escena
        bsdf.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        return mat
    if img is not None:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.name = "P6aTex_" + name
        node.image = img
        mat.node_tree.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
    mat.double_sided = double_sided
    return mat


def run_split(asset, input_path, tex_path, out_path, dry_run):
    report("asset=%s input=%s tex=%s out=%s dry=%s" % (asset, input_path, tex_path, out_path, dry_run))
    regions = list(RACK_REGIONS if asset == "rack" else STORAGE_REGIONS)

    # 1. import
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=input_path)
    src = find_tripo_mesh()
    if src is None:
        raise SystemExit("no hay mesh fuente")

    # 2. anclaje: origen en base y=0 (sin re-escalar — el fit se preserva)
    lo = src.data.bound_box
    min_y = min(v[1] for v in lo)
    if abs(min_y) > 1e-3:
        report("corrijo anclaje: base y=%0.3f → 0" % min_y)
        src.delta_location.y -= min_y
    bpy.ops.object.select_all(action="DESELECT")
    src.select_set(True)
    bpy.context.view_layer.objects.active = src
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")

    # 3. textura compartida (albedo horneado full-res del provenance)
    img = None
    if tex_path:
        try:
            img = bpy.data.images.load(tex_path)
        except Exception as e:
            report("AVISO: no pude cargar %s (%s)" % (tex_path, e))

    # 4. diagnóstico de islas
    islands = collect_islands(src)
    report("islas UV detectadas: %d" % len(islands))
    for i, isl in enumerate(islands):
        b = island_bounds(src, isl)
        c = island_centroid_3d(src, isl)
        report("  isla %d: uv[%.3f,%.3f]-[%.3f,%.3f] centro(%s) caras=%d" % (
            i, b[0], b[1], b[2], b[3],
            ("%.3f,%.3f,%.3f" % (c.x, c.y, c.z)) if c else "?",
            len(isl)))

    if dry_run:
        report("DRY-RUN: no modifico nada. Revisa las islas y ajusta uv_bounds/axis en el script.")
        return

    # 5. separar regiones (siempre sobre el mesh que conserva las caras)
    remaining = [src]
    made = []
    for reg in regions:
        target = None
        face_idx = set()
        for obj in remaining:
            for isl in collect_islands(obj):
                b = island_bounds(obj, isl)
                c = island_centroid_3d(obj, isl)
                if reg["uv_bounds"] and not uv_bounds_ok(reg["uv_bounds"], b):
                    continue
                if not axis_ok(reg["axis"], reg["axis_range"], c):
                    continue
                target = obj
                for f in isl:
                    face_idx.add(f.index)
            if target is not None:
                break
        if target is None or not face_idx:
            if reg.get("optional"):
                report("región %s: no aislable con los filtros actuales — queda en chassis (esperado si el mesh es watertight; ajustar con el dry-run)" % reg["name"])
                continue
            report("AVISO: región %s sin caras (ajusta uv_bounds/axis o sepárala a mano)" % reg["name"])
            continue
        new_obj = select_and_separate(target, face_idx, reg["name"])
        if new_obj is None:
            continue
        mat = make_material(reg["name"], img, reg["pbr"], reg.get("double_sided", False))
        new_obj.data.materials.append(mat)
        made.append(reg["name"])
        report("región %s separada: %d caras" % (reg["name"], len(face_idx)))
        remaining = [o for o in remaining if o is not target] + [new_obj]

    # 6. chassis: el resto + PBR del contrato
    for obj in remaining:
        if len(obj.data.polygons) == 0:
            continue
        obj.name = "chassis"
        mat = make_material("chassis", img, CHASSIS_PBR[asset], False)
        obj.data.materials.append(mat)
        made.append("chassis")
        break

    # 7. export (ASSET-PIPELINE §5): Triangulate AL FINAL, Apply Transforms, sin extras
    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.data.objects:
        if o.type == "MESH" and o.name in made:
            o.select_set(True)
            mod = o.modifiers.new(name="P6aTri", type="TRIANGULATE")
            mod.quad_method = "SHORTEST_DIAGONAL"
    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_attributes=False,
    )
    report("export OK: %s" % out_path)
    report("meshes exportados: " + ", ".join(sorted(set(made))))


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="P6a split canónico Blender")
    p.add_argument("--asset", required=True, choices=["rack", "storage"])
    p.add_argument("--input", required=True)
    p.add_argument("--tex")
    p.add_argument("--out", required=True)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    run_split(args.asset, args.input, args.tex, args.out, args.dry_run)
