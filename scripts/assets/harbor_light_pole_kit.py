import bpy
import bmesh
from math import radians
from mathutils import Vector

# ----------------------------
# Helpers
# ----------------------------

def _append_bmesh(dst: bmesh.types.BMesh, src: bmesh.types.BMesh):
    """Append src geometry into dst (copy verts/edges/faces)."""
    src.verts.ensure_lookup_table()
    src.edges.ensure_lookup_table()
    src.faces.ensure_lookup_table()

    vmap = {}
    for v in src.verts:
        nv = dst.verts.new(v.co)
        vmap[v] = nv

    dst.verts.ensure_lookup_table()

    # edges
    for e in src.edges:
        v1 = vmap[e.verts[0]]
        v2 = vmap[e.verts[1]]
        try:
            dst.edges.new((v1, v2))
        except ValueError:
            pass  # edge already exists

    dst.edges.ensure_lookup_table()

    # faces
    for f in src.faces:
        verts = [vmap[v] for v in f.verts]
        try:
            nf = dst.faces.new(verts)
            nf.smooth = f.smooth
        except ValueError:
            pass  # face already exists

def join_meshes_no_ops(name: str, objs):
    """
    Merge mesh objects into one mesh object using evaluated depsgraph meshes.
    This avoids stale transforms/modifiers issues in Blender 5.x.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bm_merged = bmesh.new()

    # Make sure transforms are up-to-date before we read matrix_world/to_mesh
    bpy.context.view_layer.update()

    for obj in objs:
        if not obj or obj.type != "MESH":
            continue

        eval_obj = obj.evaluated_get(depsgraph)

        # Get evaluated mesh (includes modifiers, correct data layers)
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

    # Delete sources
    for obj in objs:
        if obj and obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    return merged_obj


def set_node_input(node, names, value):
    """Set first matching input socket from a list of possible names."""
    for n in names:
        sock = node.inputs.get(n)
        if sock is not None:
            sock.default_value = value
            return True
    return False

def remove_collection_tree(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return

    # 1) Unlink from ANY parent collection (including Scene Collection)
    for parent in bpy.data.collections:
        if col.name in parent.children:
            parent.children.unlink(col)

    # Scene root collection isn't in bpy.data.collections; handle it explicitly
    scene_root = bpy.context.scene.collection
    if col.name in scene_root.children:
        scene_root.children.unlink(col)

    # 2) Recursively delete objects in this collection tree
    def recurse_delete(c):
        # Delete children first
        for child in list(c.children):
            recurse_delete(child)

        # Remove objects linked to this collection
        for obj in list(c.objects):
            bpy.data.objects.remove(obj, do_unlink=True)

    recurse_delete(col)

    # 3) Remove subcollections (now empty), then the root
    def recurse_remove_subcollections(c):
        for child in list(c.children):
            recurse_remove_subcollections(child)
            if child.users == 0:
                bpy.data.collections.remove(child)

    recurse_remove_subcollections(col)

    if col.users == 0:
        bpy.data.collections.remove(col)

    # 4) Optional: purge orphaned datablocks to prevent .blend bloat on reruns
    try:
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    except TypeError:
        bpy.ops.outliner.orphans_purge()


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # Optional: purge orphaned datablocks (meshes/materials) so reruns don't bloat the .blend
    try:
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    except TypeError:
        # Older blender signature
        bpy.ops.outliner.orphans_purge()

def apply_location_to_mesh(obj):
    # Bake object location into mesh data, then zero it
    obj.data.transform(obj.matrix_world)
    obj.matrix_world.identity()

def move_to_collection(obj, target_col):
    # Link to target if needed
    if obj.name not in target_col.objects:
        target_col.objects.link(obj)

    # Unlink from every other collection that currently contains the object
    for col in list(obj.users_collection):
        if col != target_col:
            col.objects.unlink(obj)


def ensure_collection(name, parent=None):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
    if parent and col.name not in parent.children:
        parent.children.link(col)
    if not parent and col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col

def ensure_material(name, kind="metal", emissive_strength=50.0):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in nt.nodes:
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)

    if kind == "emissive":
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Strength"].default_value = emissive_strength
        em.location = (0, 0)
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    else:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.location = (0, 0)
        if kind == "metal":
            bsdf.inputs["Metallic"].default_value = 1.0
            bsdf.inputs["Roughness"].default_value = 0.6
            bsdf.inputs["Base Color"].default_value = (0.15, 0.16, 0.17, 1.0)
        elif kind == "paint":
            bsdf.inputs["Metallic"].default_value = 0.2
            bsdf.inputs["Roughness"].default_value = 0.65
            bsdf.inputs["Base Color"].default_value = (0.22, 0.24, 0.26, 1.0)
        elif kind == "glass":
            # Blender 4.x Principled v2 renamed several sockets.
            set_node_input(bsdf, ["Transmission Weight", "Transmission"], 0.9)
            set_node_input(bsdf, ["Roughness"], 0.15)
            set_node_input(bsdf, ["IOR"], 1.45)
            set_node_input(bsdf, ["Base Color"], (0.9, 0.95, 1.0, 1.0))

            # Optional: if available, make it a bit more "glass-like"
            set_node_input(bsdf, ["Specular IOR Level", "Specular"], 0.5)

        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def set_active(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

def add_cylinder(name, radius, depth, verts=24, location=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts,
        radius=radius,
        depth=depth,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj

def add_uv_sphere(name, radius, seg=16, ring=8, location=(0,0,0)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=seg,
        ring_count=ring,
        radius=radius,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj

def add_bevel(obj, width=0.01, segments=2):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = radians(30)

def shade_smooth(obj, auto_smooth_angle=radians(30)):
    # Blender 4.x removed Mesh.use_auto_smooth; use the operator instead when available.
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # Always smooth shading
    bpy.ops.object.shade_smooth()

    # Smooth-by-angle (works in Blender 4.x, also exists in some late 3.x builds)
    if hasattr(bpy.ops.object, "shade_smooth_by_angle"):
        bpy.ops.object.shade_smooth_by_angle(angle=auto_smooth_angle)


def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

# ----------------------------
# Build pieces
# ----------------------------

def build_base_flange(radius=0.14, thickness=0.02, bolt_count=6, bolt_r=0.008, bolt_h=0.012, lod="LOD0"):
    flange = add_cylinder(f"BaseFlange_{lod}", radius=radius, depth=thickness, verts=32, location=(0,0,thickness/2))
    add_bevel(flange, width=0.003, segments=2)

    bolts = []
    if lod == "LOD0":
        import math
        for i in range(bolt_count):
            a = (i / bolt_count) * math.tau
            x = (radius * 0.65) * math.cos(a)
            y = (radius * 0.65) * math.sin(a)
            b = add_cylinder(f"Bolt_{i}_{lod}", radius=bolt_r, depth=bolt_h, verts=12, location=(x,y,thickness + bolt_h/2))
            bolts.append(b)

    return flange, bolts

def build_light_head_simple(head_r=0.09, head_h=0.14, lens_r=0.055, lod="LOD0", emissive=False):
    # Head body
    head = add_cylinder(f"LightHead_{lod}", radius=head_r, depth=head_h, verts=24 if lod!="LOD0" else 32,
                        location=(0,0,0))
    add_bevel(head, width=0.004 if lod=="LOD0" else 0.002, segments=2 if lod=="LOD0" else 1)

    # Lens / cap
    if lod == "LOD2":
        cap = add_uv_sphere(f"LightCap_{lod}", radius=lens_r, seg=12, ring=6, location=(0,0,head_h/2))
    else:
        cap = add_uv_sphere(f"LightLens_{lod}", radius=lens_r, seg=16, ring=8, location=(0,0,head_h/2))

    return head, cap

def build_pole(height=4.0, pole_r=0.05, lod="LOD0"):
    verts = 16 if lod=="LOD2" else (20 if lod=="LOD1" else 28)
    pole = add_cylinder(f"Pole_{lod}", radius=pole_r, depth=height, verts=verts, location=(0,0,height/2))
    if lod == "LOD0":
        add_bevel(pole, width=0.003, segments=2)
    shade_smooth(pole)
    return pole

# ----------------------------
# Main generator
# ----------------------------

def make_lightpole(
    name="LightPole",
    variant="short",
    height=4.0,
    pole_r=0.05,
    head_offset=0.18,     # how far the head sits above the pole top
    head_r=0.09,
    head_h=0.14,
    lens_r=0.055,
    emissive_strength=60.0
):
    root_col = ensure_collection("HARBOR_LIGHTPOLE")
    col_lod0 = ensure_collection(f"{name}_LOD0", root_col)
    col_lod1 = ensure_collection(f"{name}_LOD1", root_col)
    col_lod2 = ensure_collection(f"{name}_LOD2", root_col)

    # Materials
    mat_paint = ensure_material("MAT_Metal_Painted", kind="paint")
    mat_glass = ensure_material("MAT_Light_Glass", kind="glass")
    mat_em = ensure_material("MAT_Light_Emissive", kind="emissive", emissive_strength=emissive_strength)

    # Root empty (for easy placement)
    empty = bpy.data.objects.new(f"{name}_Root", None)
    bpy.context.scene.collection.objects.link(empty)

    # ---- LOD0 ----
    pole0 = build_pole(height=height, pole_r=pole_r, lod="LOD0")
    flange0, bolts0 = build_base_flange(lod="LOD0")
    head0, lens0 = build_light_head_simple(head_r=head_r, head_h=head_h, lens_r=lens_r, lod="LOD0")

    # Position head at top
    head0.location.z = height + head_h/2
    lens0.location.z = head0.location.z + (head_h/2) * 0.55

    assign_mat(pole0, mat_paint)
    assign_mat(flange0, mat_paint)
    for b in bolts0:
        assign_mat(b, mat_paint)
    assign_mat(head0, mat_paint)
    assign_mat(lens0, mat_glass)

    lod0_obj = join_meshes_no_ops(f"{name}_LOD0", [pole0, flange0, lens0, head0] + bolts0)
    lod0_obj.parent = empty
    move_to_collection(lod0_obj, col_lod0)

    # ---- LOD1 ----
    pole1 = build_pole(height=height, pole_r=pole_r, lod="LOD1")
    flange1, bolts1 = build_base_flange(lod="LOD1")  # no bolts for LOD1
    head1, lens1 = build_light_head_simple(head_r=head_r, head_h=head_h, lens_r=lens_r, lod="LOD1")

    head1.location.z = height + head_h/2
    lens1.location.z = head1.location.z + (head_h/2) * 0.55

    assign_mat(pole1, mat_paint)
    assign_mat(flange1, mat_paint)
    assign_mat(head1, mat_paint)
    assign_mat(lens1, mat_glass)

    lod1_obj = join_meshes_no_ops(f"{name}_LOD1", [pole1, flange1, lens1, head1])
    lod1_obj.parent = empty
    move_to_collection(lod1_obj, col_lod1)

    # ---- LOD2 ----
    pole2 = build_pole(height=height, pole_r=pole_r*0.85, lod="LOD2")
    head2, cap2 = build_light_head_simple(head_r=head_r*0.7, head_h=head_h*0.7, lens_r=lens_r*0.9, lod="LOD2")

    head2.location.z = height + (head_h*0.7)/2
    cap2.location.z = head2.location.z + ((head_h*0.7)/2) * 0.8

    assign_mat(pole2, mat_paint)
    assign_mat(head2, mat_paint)
    assign_mat(cap2, mat_em)  # glowing cap

    lod2_obj = join_meshes_no_ops(f"{name}_LOD2", [pole2, head2, cap2])
    lod2_obj.parent = empty
    move_to_collection(lod2_obj, col_lod2)

    # Put empty at origin / ground contact and keep LOD objects aligned
    empty.location = (0,0,0)
    return empty

# ----------------------------
# Presets
# ----------------------------

def make_presets():
    # Short / quay edge
    make_lightpole(
        name="LightPole_Short",
        variant="short",
        height=3.8,
        pole_r=0.05,
        head_offset=0.16,
        head_r=0.085,
        head_h=0.13,
        lens_r=0.05,
        emissive_strength=70.0
    )

    # Tall / pier end
    make_lightpole(
        name="LightPole_Tall",
        variant="tall",
        height=8.6,
        pole_r=0.075,
        head_offset=0.22,
        head_r=0.11,
        head_h=0.16,
        lens_r=0.065,
        emissive_strength=120.0
    )

remove_collection_tree("HARBOR_LIGHTPOLE")
make_presets()
