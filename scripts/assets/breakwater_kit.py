import bpy
import bmesh
import math

# ============================================================
# Breakwater Straight Segment Kit (Blender 5.0+)
# Conventions:
#   - Units: meters (1 BU = 1m)
#   - Z up
#   - Forward along +Y
#   - Pivot at start face center on ground plane: (0,0,0)
#   - Segment runs from Y=0 to Y=L
# ============================================================

COLLECTION_NAME = "BreakwaterKit"
ASSET_BASE_NAME = "breakwater_straight_10m"

# Core dimensions (meters)
L = 10.0
HEIGHT = 2.5
TOP_W = 3.0
BASE_W = 7.0

# How much to avoid displacing near the ends (meters)
END_SEAM_GUARD = 0.35

# LOD controls (subdivision + displacement strength)
LOD_SETTINGS = {
    "lod0": {"subdiv": 5, "disp_strength": 0.18, "disp_mid": 0.0, "noise_scale": 2.2},
    "lod1": {"subdiv": 3, "disp_strength": 0.10, "disp_mid": 0.0, "noise_scale": 2.6},
    "lod2": {"subdiv": 0, "disp_strength": 0.00, "disp_mid": 0.0, "noise_scale": 0.0},
}

# Collider: simple box (very cheap)
COLLIDER_HEIGHT = HEIGHT
COLLIDER_WIDTH = BASE_W
COLLIDER_LENGTH = L

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def ensure_units_meters():
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0

def deselect_all():
    for o in bpy.context.selected_objects:
        o.select_set(False)

def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

def get_collection(name: str):
    return bpy.data.collections.get(name)

def wipe_collection(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return

    ensure_object_mode()
    # delete objects in the collection
    objs = list(col.objects)
    if objs:
        deselect_all()
        for o in objs:
            o.select_set(True)
        bpy.ops.object.delete()

    # unlink from parents
    for parent_col in bpy.data.collections:
        if col.name in parent_col.children.keys():
            parent_col.children.unlink(col)

    # unlink from scene collection if linked
    sc = bpy.context.scene.collection
    if col.name in sc.children.keys():
        sc.children.unlink(col)

    bpy.data.collections.remove(col)

def create_collection(name: str):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col

def link_only_to_collection(obj: bpy.types.Object, col: bpy.types.Collection):
    # unlink from any other collections
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)

def set_active(obj: bpy.types.Object):
    bpy.context.view_layer.objects.active = obj

def add_custom_props(obj, asset_role: str):
    obj["asset_role"] = asset_role
    obj["units"] = "meters"
    obj["forward_axis"] = "+Y"

def shade_smooth_auto(obj: bpy.types.Object, angle_deg: float = 35.0):
    if obj.type != "MESH":
        return
    ensure_object_mode()
    deselect_all()
    obj.select_set(True)
    set_active(obj)
    bpy.ops.object.shade_smooth()
    # Blender 5.x: "auto smooth" via operator (Smooth by Angle)
    bpy.ops.object.shade_auto_smooth(use_auto_smooth=True, angle=math.radians(angle_deg))
    obj.select_set(False)

# ------------------------------------------------------------
# Mesh creation: trapezoid prism extruded along +Y
# Coordinates:
#   y: 0..L
#   z: 0..HEIGHT
#   x: centered
# ------------------------------------------------------------
def create_trapezoid_prism_mesh(mesh_name: str):
    mesh = bpy.data.meshes.new(mesh_name)
    bm = bmesh.new()

    bw = BASE_W * 0.5
    tw = TOP_W * 0.5
    h = HEIGHT

    # 8 verts: start face (y=0) + end face (y=L)
    # Start face
    v0 = bm.verts.new((-bw, 0.0, 0.0))
    v1 = bm.verts.new(( bw, 0.0, 0.0))
    v2 = bm.verts.new(( tw, 0.0, h))
    v3 = bm.verts.new((-tw, 0.0, h))
    # End face
    v4 = bm.verts.new((-bw, L, 0.0))
    v5 = bm.verts.new(( bw, L, 0.0))
    v6 = bm.verts.new(( tw, L, h))
    v7 = bm.verts.new((-tw, L, h))

    bm.faces.new((v0, v1, v2, v3))  # start face
    bm.faces.new((v5, v4, v7, v6))  # end face (winding outward)
    bm.faces.new((v0, v4, v5, v1))  # bottom
    bm.faces.new((v3, v2, v6, v7))  # top
    bm.faces.new((v0, v3, v7, v4))  # left side
    bm.faces.new((v1, v5, v6, v2))  # right side

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    return mesh

def create_object_from_mesh(obj_name: str, mesh: bpy.types.Mesh, col: bpy.types.Collection):
    obj = bpy.data.objects.new(obj_name, mesh)
    link_only_to_collection(obj, col)
    obj.location = (0.0, 0.0, 0.0)  # pivot already correct
    add_custom_props(obj, "visual")
    return obj

# ------------------------------------------------------------
# Vertex group to protect seams:
# weight = 1 for verts not near ends, 0 near ends or at bottom.
# This keeps the start/end faces clean for tiling.
# ------------------------------------------------------------
def add_displace_vertex_group(obj: bpy.types.Object, group_name="DISPLACE_MASK"):
    vg = obj.vertex_groups.new(name=group_name)

    L_local = L
    for i, v in enumerate(obj.data.vertices):
        x, y, z = v.co.x, v.co.y, v.co.z

        # No displacement on bottom edge (keeps base planar)
        if z < 0.02:
            w = 0.0
        # No displacement near the ends (keeps seams clean)
        elif y < END_SEAM_GUARD or y > (L_local - END_SEAM_GUARD):
            w = 0.0
        else:
            w = 1.0

        if w > 0.0:
            vg.add([i], w, 'REPLACE')

    return vg

# ------------------------------------------------------------
# Procedural displacement setup (no image textures)
# ------------------------------------------------------------
def get_or_create_noise_texture(tex_name: str, noise_scale: float):
    tex = bpy.data.textures.get(tex_name)
    if tex is None:
        tex = bpy.data.textures.new(tex_name, type='CLOUDS')
    # Clouds is fast and looks rubble-ish when subdivided
    tex.noise_scale = noise_scale
    tex.cloud_type = 'GRAYSCALE'
    return tex

def add_lod_modifiers(obj: bpy.types.Object, lod_key: str):
    s = LOD_SETTINGS[lod_key]
    subdiv_levels = int(s["subdiv"])
    disp_strength = float(s["disp_strength"])
    disp_mid = float(s["disp_mid"])
    noise_scale = float(s["noise_scale"])

    # Subdivision first to give displacement vertices to work with
    if subdiv_levels > 0:
        sub = obj.modifiers.new(name="SUBDIV", type="SUBSURF")
        sub.subdivision_type = 'SIMPLE'  # keeps planes more planar than Catmull-Clark
        sub.levels = subdiv_levels
        sub.render_levels = subdiv_levels

    # Displace
    if disp_strength > 0.0:
        vg = add_displace_vertex_group(obj)

        disp = obj.modifiers.new(name="DISPLACE", type="DISPLACE")
        disp.direction = 'NORMAL'
        disp.strength = disp_strength
        disp.mid_level = disp_mid
        disp.vertex_group = vg.name

        tex = get_or_create_noise_texture(f"{ASSET_BASE_NAME}_noise", noise_scale)
        disp.texture = tex

    # Weighted normals can help LOD0/LOD1 look less “melted”
    wn = obj.modifiers.new(name="WEIGHTED_NORMAL", type="WEIGHTED_NORMAL")
    wn.keep_sharp = True

def apply_modifiers_for_export(obj: bpy.types.Object):
    ensure_object_mode()
    deselect_all()
    obj.select_set(True)
    set_active(obj)
    bpy.ops.object.convert(target='MESH')  # applies modifiers
    obj.select_set(False)

# ------------------------------------------------------------
# Collider + Snap empties
# ------------------------------------------------------------
def create_collider(col: bpy.types.Collection):
    mesh = bpy.data.meshes.new(f"COLLIDER_{ASSET_BASE_NAME}_mesh")
    bm = bmesh.new()

    w = COLLIDER_WIDTH * 0.5
    h = COLLIDER_HEIGHT
    # collider along y=0..L
    # 8 verts for a box
    v0 = bm.verts.new((-w, 0.0, 0.0))
    v1 = bm.verts.new(( w, 0.0, 0.0))
    v2 = bm.verts.new(( w, 0.0, h))
    v3 = bm.verts.new((-w, 0.0, h))

    v4 = bm.verts.new((-w, L, 0.0))
    v5 = bm.verts.new(( w, L, 0.0))
    v6 = bm.verts.new(( w, L, h))
    v7 = bm.verts.new((-w, L, h))

    bm.faces.new((v0, v1, v2, v3))
    bm.faces.new((v5, v4, v7, v6))
    bm.faces.new((v0, v4, v5, v1))
    bm.faces.new((v3, v2, v6, v7))
    bm.faces.new((v0, v3, v7, v4))
    bm.faces.new((v1, v5, v6, v2))

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(f"COLLIDER_{ASSET_BASE_NAME}", mesh)
    link_only_to_collection(obj, col)
    obj.display_type = 'WIRE'
    obj.hide_render = True
    add_custom_props(obj, "collision")
    return obj

def create_snap_empty(name: str, location, col: bpy.types.Collection):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = 'PLAIN_AXES'
    e.empty_display_size = 0.6
    e.location = location
    link_only_to_collection(e, col)
    add_custom_props(e, "snap_point")
    return e

# ------------------------------------------------------------
# Main
# ------------------------------------------------------------
def main():
    ensure_units_meters()

    # Idempotent: remove previous kit
    wipe_collection(COLLECTION_NAME)
    col = create_collection(COLLECTION_NAME)

    # LOD2 base (no modifiers)
    mesh_lod2 = create_trapezoid_prism_mesh(f"{ASSET_BASE_NAME}_lod2_mesh")
    lod2 = create_object_from_mesh(f"{ASSET_BASE_NAME}_lod2", mesh_lod2, col)
    add_custom_props(lod2, "visual_lod")
    lod2["lod"] = 2

    # LOD1
    mesh_lod1 = create_trapezoid_prism_mesh(f"{ASSET_BASE_NAME}_lod1_mesh")
    lod1 = create_object_from_mesh(f"{ASSET_BASE_NAME}_lod1", mesh_lod1, col)
    add_custom_props(lod1, "visual_lod")
    lod1["lod"] = 1
    add_lod_modifiers(lod1, "lod1")
    apply_modifiers_for_export(lod1)
    shade_smooth_auto(lod1, 35.0)

    # LOD0
    mesh_lod0 = create_trapezoid_prism_mesh(f"{ASSET_BASE_NAME}_lod0_mesh")
    lod0 = create_object_from_mesh(f"{ASSET_BASE_NAME}_lod0", mesh_lod0, col)
    add_custom_props(lod0, "visual_lod")
    lod0["lod"] = 0
    add_lod_modifiers(lod0, "lod0")
    apply_modifiers_for_export(lod0)
    shade_smooth_auto(lod0, 35.0)

    # Parent LODs under LOD0 for organization (optional)
    lod1.parent = lod0
    lod2.parent = lod0

    # Collider (separate node)
    collider = create_collider(col)
    collider.parent = lod0

    # Snap points
    snap_start = create_snap_empty(f"SNAP_START_{ASSET_BASE_NAME}", (0.0, 0.0, 0.0), col)
    snap_end   = create_snap_empty(f"SNAP_END_{ASSET_BASE_NAME}",   (0.0, L,   0.0), col)
    snap_start.parent = lod0
    snap_end.parent = lod0

    # Make LOD2 flat shaded (optional) — usually fine either way
    shade_smooth_auto(lod2, 30.0)

    print(f"Created breakwater kit in collection '{COLLECTION_NAME}'.")

if __name__ == "__main__":
    main()
