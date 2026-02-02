import bpy
import bmesh
from math import radians

# ============================================================
# Cleanup (idempotent)
# ============================================================

def remove_collection_tree(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return

    # Unlink from any parent collection
    for parent in bpy.data.collections:
        if col.name in parent.children:
            parent.children.unlink(col)

    root = bpy.context.scene.collection
    if col.name in root.children:
        root.children.unlink(col)

    # Delete objects recursively
    def recurse_delete(c):
        for child in list(c.children):
            recurse_delete(child)
        for obj in list(c.objects):
            bpy.data.objects.remove(obj, do_unlink=True)

    recurse_delete(col)

    # Remove subcollections then root
    def recurse_remove(c):
        for child in list(c.children):
            recurse_remove(child)
            if child.users == 0:
                bpy.data.collections.remove(child)

    recurse_remove(col)

    if col.users == 0:
        bpy.data.collections.remove(col)

    try:
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    except TypeError:
        bpy.ops.outliner.orphans_purge()


def ensure_collection(name, parent=None):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
    if parent and col.name not in parent.children:
        parent.children.link(col)
    if not parent and col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col


# ============================================================
# Materials (simple + stable)
# ============================================================

def ensure_metal_material(name="MAT_CleatSteel"):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Metallic"].default_value = 1.0
        bsdf.inputs["Roughness"].default_value = 0.45
    return mat

def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


# ============================================================
# Robust merge (depsgraph evaluated) -> one mesh per LOD
# ============================================================

def _append_bmesh(dst: bmesh.types.BMesh, src: bmesh.types.BMesh):
    src.verts.ensure_lookup_table()
    src.edges.ensure_lookup_table()
    src.faces.ensure_lookup_table()

    vmap = {}
    for v in src.verts:
        vmap[v] = dst.verts.new(v.co)

    for e in src.edges:
        v1 = vmap[e.verts[0]]
        v2 = vmap[e.verts[1]]
        try:
            dst.edges.new((v1, v2))
        except ValueError:
            pass

    for f in src.faces:
        verts = [vmap[v] for v in f.verts]
        try:
            nf = dst.faces.new(verts)
            nf.smooth = f.smooth
        except ValueError:
            pass

def merge_objects_evaluated(name: str, objs):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bpy.context.view_layer.update()

    bm_merged = bmesh.new()

    for obj in objs:
        if not obj or obj.type != "MESH":
            continue

        eval_obj = obj.evaluated_get(depsgraph)
        eval_mesh = eval_obj.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
        if eval_mesh is None:
            continue

        bm_part = bmesh.new()
        bm_part.from_mesh(eval_mesh)
        bm_part.transform(eval_obj.matrix_world)

        _append_bmesh(bm_merged, bm_part)

        bm_part.free()
        eval_obj.to_mesh_clear()

    merged_mesh = bpy.data.meshes.new(name + "_Mesh")
    bm_merged.to_mesh(merged_mesh)
    bm_merged.free()

    merged_obj = bpy.data.objects.new(name, merged_mesh)
    bpy.context.scene.collection.objects.link(merged_obj)

    # delete sources
    for obj in objs:
        if obj and obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    return merged_obj


# ============================================================
# Primitive builders (bpy.ops, stable)
# ============================================================

def deselect_all():
    for o in bpy.context.selected_objects:
        o.select_set(False)

def add_cube(name, size=1.0):
    deselect_all()
    bpy.ops.mesh.primitive_cube_add(size=size, align="WORLD", location=(0,0,0), rotation=(0,0,0))
    obj = bpy.context.active_object
    obj.name = name
    return obj

def add_cylinder(name, radius=0.05, depth=0.1, verts=24):
    deselect_all()
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts,
        radius=radius,
        depth=depth,
        align="WORLD",
        location=(0,0,0),
        rotation=(0,0,0),
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj

def add_bevel(obj, width=0.005, segments=2, angle_deg=30):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = radians(angle_deg)


# ============================================================
# Cleat geometry (simple horn cleat)
# ============================================================

def build_cleat_parts(lod="LOD0", scale=1.0):
    """
    Returns loose objects for a horn cleat:
    - base plate
    - center post
    - two horns (cylinders) + optional end caps look via bevel only
    """
    # Dimensions (meters)
    base_w = 0.28 * scale
    base_d = 0.10 * scale
    base_t = 0.03 * scale

    post_r = 0.035 * scale
    post_h = 0.06 * scale

    horn_r = 0.028  * scale
    horn_len = 0.20 * scale
    horn_z = base_t + post_h * 0.65

    # LOD simplification
    if lod == "LOD1":
        horn_r *= 0.95
        post_r *= 0.95
    if lod == "LOD2":
        # LOD2: very simple "T" block
        base_w *= 0.95
        base_d *= 0.95

    parts = []

    if lod == "LOD2":
        # one-piece dumb proxy: a beveled block shaped like a cleat
        blk = add_cube(f"_cleatProxy_{lod}", size=1.0)
        blk.scale = (base_w/2, base_d/2, (base_t + post_h)/2)
        blk.location = (0.0, 0.0, (base_t + post_h)/2)
        parts.append(blk)
        return parts

    # Base plate
    base = add_cube(f"_base_{lod}", size=1.0)
    base.scale = (base_w/2, base_d/2, base_t/2)
    base.location = (0.0, 0.0, base_t/2)
    parts.append(base)

    # Center post
    post = add_cylinder(f"_post_{lod}", radius=post_r, depth=post_h, verts=20 if lod=="LOD1" else 28)
    post.location = (0.0, 0.0, base_t + post_h/2)
    parts.append(post)

    # Horns (two cylinders along X, offset +/-Y a bit)
    horn_verts = 16 if lod=="LOD1" else 24

    horn1 = add_cylinder(f"_horn1_{lod}", radius=horn_r, depth=horn_len, verts=horn_verts)
    horn1.rotation_euler = (0.0, radians(90), 0.0)  # cylinder depth axis (Z) -> X
    horn1.location = (0.0, 0.0, horn_z)
    parts.append(horn1)

    # Optional: slight vertical offset to imply “horn flare” (tiny realism)
    horn2 = add_cylinder(f"_horn2_{lod}", radius=horn_r*0.92, depth=horn_len*0.88, verts=horn_verts)
    horn2.rotation_euler = (0.0, radians(90), 0.0)
    horn2.location = (0.0, 0.0, horn_z + horn_r*0.6)
    parts.append(horn2)

    return parts


# ============================================================
# Generator
# ============================================================

def make_cleat(name="Cleat_Standard", scale=1.0):
    root = ensure_collection("CLEAT")
    col0 = ensure_collection(f"{name}_LOD0", root)
    col1 = ensure_collection(f"{name}_LOD1", root)
    col2 = ensure_collection(f"{name}_LOD2", root)

    mat = ensure_metal_material()

    empty = bpy.data.objects.new(f"{name}_Root", None)
    bpy.context.scene.collection.objects.link(empty)

    # LOD0
    parts0 = build_cleat_parts("LOD0", scale=scale)
    lod0 = merge_objects_evaluated(f"{name}_LOD0", parts0)
    assign_mat(lod0, mat)
    add_bevel(lod0, width=0.006, segments=2)
    lod0.parent = empty
    col0.objects.link(lod0)
    bpy.context.scene.collection.objects.unlink(lod0)

    # LOD1
    parts1 = build_cleat_parts("LOD1", scale=scale)
    lod1 = merge_objects_evaluated(f"{name}_LOD1", parts1)
    assign_mat(lod1, mat)
    add_bevel(lod1, width=0.004, segments=1)
    lod1.parent = empty
    col1.objects.link(lod1)
    bpy.context.scene.collection.objects.unlink(lod1)

    # LOD2
    parts2 = build_cleat_parts("LOD2", scale=scale)
    lod2 = merge_objects_evaluated(f"{name}_LOD2", parts2)
    assign_mat(lod2, mat)
    lod2.parent = empty
    col2.objects.link(lod2)
    bpy.context.scene.collection.objects.unlink(lod2)

    empty.location = (0, 0, 0)
    return empty


# ============================================================
# Run (idempotent)
# ============================================================

remove_collection_tree("CLEAT")
make_cleat("Cleat_Standard", scale=1.0)
make_cleat("Cleat_Large", scale=1.35)
