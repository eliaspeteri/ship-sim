import bpy
import bmesh
from math import radians

# ----------------------------
# Idempotency: remove our generated collection tree
# ----------------------------

def remove_collection_tree(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return

    # Unlink from any parent collection
    for parent in bpy.data.collections:
        if col.name in parent.children:
            parent.children.unlink(col)

    scene_root = bpy.context.scene.collection
    if col.name in scene_root.children:
        scene_root.children.unlink(col)

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

    # Optional purge
    try:
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    except TypeError:
        bpy.ops.outliner.orphans_purge()


# ----------------------------
# Collections + materials (version-safe sockets)
# ----------------------------

def ensure_collection(name, parent=None):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
    if parent and col.name not in parent.children:
        parent.children.link(col)
    if not parent and col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col

def set_node_input(node, names, value):
    for n in names:
        sock = node.inputs.get(n)
        if sock is not None:
            sock.default_value = value
            return True
    return False

def ensure_material(name, kind="paint", emissive_strength=50.0):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)

    if kind == "emissive":
        em = nt.nodes.new("ShaderNodeEmission")
        em.location = (0, 0)
        em.inputs["Strength"].default_value = emissive_strength
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
        return mat

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)

    if kind == "paint":
        set_node_input(bsdf, ["Base Color"], (0.22, 0.24, 0.26, 1.0))
        set_node_input(bsdf, ["Metallic"], 0.2)
        set_node_input(bsdf, ["Roughness"], 0.7)
    elif kind == "metal":
        set_node_input(bsdf, ["Base Color"], (0.15, 0.16, 0.17, 1.0))
        set_node_input(bsdf, ["Metallic"], 1.0)
        set_node_input(bsdf, ["Roughness"], 0.5)

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


# ----------------------------
# Mesh builder (single object per LOD, no ops)
# ----------------------------

def new_mesh_object(name: str, bm: bmesh.types.BMesh):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

def bevel_modifier(obj, width=0.01, segments=2, angle_deg=30):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = radians(angle_deg)


# ----------------------------
# Cabinet geometry (simple but nice)
# ----------------------------

def build_cabinet_lod0(name: str, w=0.80, d=0.35, h=1.20,
                      door_inset=0.015, door_gap=0.006,
                      handle_r=0.010, handle_len=0.10):
    bm = bmesh.new()

    # Main body box (origin at ground center)
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w / 2
        v.co.y *= d / 2
        v.co.z *= h / 2
        v.co.z += h / 2

    # Door panel: inset face on the "front" (we'll treat +Y as front)
    # Find front face (highest average Y)
    bm.faces.ensure_lookup_table()
    front = max(bm.faces, key=lambda f: sum(v.co.y for v in f.verts) / len(f.verts))

    # Inset to create door outline
    res = bmesh.ops.inset_region(
        bm,
        faces=[front],
        thickness=door_gap,
        depth=door_inset,
        use_boundary=True,
        use_even_offset=True,
    )

    # Simple rectangular handle (robust across Blender versions)


    handle_w = handle_len        # along X
    handle_t = handle_r * 2.0    # thickness
    handle_h = handle_r * 6.0    # height

    # Place handle near right edge, on the front face (+Y)
    margin_x = 0.18                # 18 cm from right edge (tweak)
    epsilon_y = 0.002              # 2 mm inside the surface so it "attaches"
    hx = (w / 2) - margin_x - (handle_w * 0.5)
    hy = (d / 3.3) - epsilon_y
    hz = h * 0.55

    hgeom = bmesh.ops.create_cube(bm, size=1.0)
    hverts = hgeom["verts"]

    bm.faces.ensure_lookup_table()
    front = max(bm.faces, key=lambda f: f.calc_center_median().y)


    # Scale into a small bar
    for v in hverts:
        v.co.x *= handle_w / 2
        v.co.y *= handle_t / 2
        v.co.z *= handle_h / 2

    # Move it to the door front (+Y)
    bmesh.ops.translate(
        bm,
        verts=hverts,
        vec=(hx - handle_w * 0.5, hy, hz),
    )


    # Cap the ends (optional: keep stupid-simple; bevel will smooth it enough)

    obj = new_mesh_object(name, bm)
    obj.location = (0, 0, 0)
    return obj

def build_cabinet_lod1(name: str, w=0.80, d=0.35, h=1.20):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w / 2
        v.co.y *= d / 2
        v.co.z *= h / 2
        v.co.z += h / 2
    obj = new_mesh_object(name, bm)
    return obj

def build_cabinet_lod2(name: str, w=0.80, d=0.35, h=1.20):
    # Even dumber: a slightly thinner box (or could be a single plane billboard later)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w / 2
        v.co.y *= d / 2
        v.co.z *= h / 2
        v.co.z += h / 2
    obj = new_mesh_object(name, bm)
    return obj


# ----------------------------
# Generator
# ----------------------------

def make_utility_cabinet(name="UtilityCabinet",
                         w=0.80, d=0.35, h=1.20):
    root_col = ensure_collection("UTILITY_CABINET")
    col_lod0 = ensure_collection(f"{name}_LOD0", root_col)
    col_lod1 = ensure_collection(f"{name}_LOD1", root_col)
    col_lod2 = ensure_collection(f"{name}_LOD2", root_col)

    mat_paint = ensure_material("MAT_Cabinet_Paint", kind="paint")
    mat_metal = ensure_material("MAT_Cabinet_Metal", kind="metal")

    # Root empty for placement
    empty = bpy.data.objects.new(f"{name}_Root", None)
    bpy.context.scene.collection.objects.link(empty)

    # LOD0
    lod0 = build_cabinet_lod0(f"{name}_LOD0", w=w, d=d, h=h)
    bevel_modifier(lod0, width=0.008, segments=2)
    assign_mat(lod0, mat_paint)
    lod0.parent = empty
    col_lod0.objects.link(lod0)
    bpy.context.scene.collection.objects.unlink(lod0)

    # LOD1
    lod1 = build_cabinet_lod1(f"{name}_LOD1", w=w, d=d, h=h)
    bevel_modifier(lod1, width=0.006, segments=1)
    assign_mat(lod1, mat_paint)
    lod1.parent = empty
    col_lod1.objects.link(lod1)
    bpy.context.scene.collection.objects.unlink(lod1)

    # LOD2
    lod2 = build_cabinet_lod2(f"{name}_LOD2", w=w, d=d, h=h)
    assign_mat(lod2, mat_paint)
    lod2.parent = empty
    col_lod2.objects.link(lod2)
    bpy.context.scene.collection.objects.unlink(lod2)

    empty.location = (0, 0, 0)
    return empty


# ----------------------------
# Run (idempotent)
# ----------------------------

remove_collection_tree("UTILITY_CABINET")
make_utility_cabinet(name="UtilityCabinet_Small", w=0.70, d=0.30, h=1.10)
make_utility_cabinet(name="UtilityCabinet_Large", w=0.95, d=0.40, h=1.45)
