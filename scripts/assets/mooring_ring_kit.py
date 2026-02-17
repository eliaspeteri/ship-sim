import bpy
import bmesh
from math import radians
from mathutils import Matrix

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

def ensure_metal_material(name="MAT_MooringSteel"):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Metallic"].default_value = 1.0
        bsdf.inputs["Roughness"].default_value = 0.55
    return mat


def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


# ============================================================
# Robust merge: depsgraph-evaluated meshes -> one mesh
# (no bpy.ops.join / no selection fragility)
# ============================================================

def _append_bmesh(dst: bmesh.types.BMesh, src: bmesh.types.BMesh):
    src.verts.ensure_lookup_table()
    src.edges.ensure_lookup_table()
    src.faces.ensure_lookup_table()

    vmap = {}
    for v in src.verts:
        nv = dst.verts.new(v.co)
        vmap[v] = nv

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
# Primitive builders (stable bpy.ops)
# ============================================================

def deselect_all():
    for o in bpy.context.selected_objects:
        o.select_set(False)

def add_torus(name, major_radius, minor_radius, major_segments=32, minor_segments=16):
    deselect_all()
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        align='WORLD',
        location=(0, 0, 0),
        rotation=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj

def add_cube(name, size=1.0):
    deselect_all()
    bpy.ops.mesh.primitive_cube_add(size=size, align='WORLD', location=(0, 0, 0), rotation=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    return obj


# ============================================================
# Mooring ring (visually correct-ish, still simple)
# ============================================================

def build_mooring_ring_parts(lod="LOD0"):
    """
    Returns [objs...] for a realistic-ish ring:
    - base plate (thin)
    - hinge ring (small torus, lies flat)
    - main ring (bigger torus, rotated up a bit)
    """
    # Scale / dimensions in meters (tweak freely)
    plate_w = 0.18
    plate_d = 0.12
    plate_t = 0.012

    # Hinge ring (smaller loop attached to plate)
    hinge_major = 0.040
    hinge_minor = 0.012

    # Main ring
    ring_major = 0.090
    ring_minor = 0.018

    if lod == "LOD1":
        # Simplify a bit
        hinge_major *= 0.95
        ring_minor *= 0.95

    if lod == "LOD2":
        # Aggressive simplification
        plate_w *= 0.9
        plate_d *= 0.9
        hinge_major = 0.0  # drop hinge entirely
        ring_minor *= 0.8

    parts = []

    # Plate (cube scaled)
    plate = add_cube(f"_plate_{lod}", size=1.0)
    plate.scale = (plate_w / 2, plate_d / 2, plate_t / 2)
    # Put top surface at z=0 (so it sits on quay surface)
    plate.location = (0.0, 0.0, -plate_t / 2)
    parts.append(plate)

    if lod != "LOD2":
        hinge = add_torus(
            f"_hinge_{lod}",
            major_radius=hinge_major,
            minor_radius=hinge_minor,
            major_segments=24 if lod == "LOD1" else 32,
            minor_segments=12 if lod == "LOD1" else 16,
        )
        # hinge lies flat, slightly above plate
        hinge.rotation_euler = (0.0, radians(90), 0.0)
        hinge.location = (0.0, 0.0, 0.040)
        parts.append(hinge)

    ring = add_torus(
        f"_ring_{lod}",
        major_radius=ring_major,
        minor_radius=ring_minor,
        major_segments=18 if lod == "LOD2" else (24 if lod == "LOD1" else 32),
        minor_segments=8 if lod == "LOD2" else (12 if lod == "LOD1" else 16),
    )

    # Make it look like it can lift: rotate “up” and offset toward hinge.
    # This matches your reference better than a flat donut.
    ring.rotation_euler = (-radians(4), 0.0, 0.0)
    ring.location = (0.0, 0.089, 0.025)

    parts.append(ring)

    return parts


def make_mooring_ring(name="MooringRing_Standard"):
    root = ensure_collection("MOORING_RING")
    col0 = ensure_collection(f"{name}_LOD0", root)
    col1 = ensure_collection(f"{name}_LOD1", root)
    col2 = ensure_collection(f"{name}_LOD2", root)

    mat = ensure_metal_material()

    empty = bpy.data.objects.new(f"{name}_Root", None)
    bpy.context.scene.collection.objects.link(empty)

    # LOD0
    parts0 = build_mooring_ring_parts("LOD0")
    lod0 = merge_objects_evaluated(f"{name}_LOD0", parts0)
    assign_mat(lod0, mat)
    lod0.parent = empty
    col0.objects.link(lod0)
    bpy.context.scene.collection.objects.unlink(lod0)

    # LOD1
    parts1 = build_mooring_ring_parts("LOD1")
    lod1 = merge_objects_evaluated(f"{name}_LOD1", parts1)
    assign_mat(lod1, mat)
    lod1.parent = empty
    col1.objects.link(lod1)
    bpy.context.scene.collection.objects.unlink(lod1)

    # LOD2
    parts2 = build_mooring_ring_parts("LOD2")
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

remove_collection_tree("MOORING_RING")
make_mooring_ring("MooringRing_Standard")
