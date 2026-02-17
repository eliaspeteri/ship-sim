import bpy
import bmesh
import math

# ============================================================
# Seabed Tile Kit (Blender 5.0+)
# - Tileable square plane with procedural displacement
# - LOD0/LOD1/LOD2
# - Collider as separate node
# - Snap points (corners) as empties
#
# Conventions:
#   Units: meters (1 BU = 1m)
#   Z up
#   Tile spans X: 0..S, Y: 0..S, Z: ~0
#   Pivot at (0,0,0) = tile "start corner"
# ============================================================

PRESET = "harbor"  # "harbor" | "deep"
ASSET_BASE_NAME = f"seabed_{PRESET}_tile_25m"
COLLECTION_NAME = f"SeabedKit_{PRESET}"

S = 25.0  # tile size (meters)
END_SEAM_GUARD = 0.7  # meters kept perfectly flat at tile edges

# LOD settings: subdivision grid + displacement strength
LOD_SETTINGS = {
    "lod0": {"grid": 160, "disp_strength": 0.35, "noise_scale": 14.0, "detail": 6.0},
    "lod1": {"grid": 80,  "disp_strength": 0.22, "noise_scale": 16.0, "detail": 4.0},
    "lod2": {"grid": 4,   "disp_strength": 0.00, "noise_scale": 0.0,  "detail": 0.0},
}

# Optional: gentle large-scale slope/undulation
ADD_BIG_WAVES = True
BIG_WAVE_STRENGTH = 0.10
BIG_WAVE_SCALE = 3.0  # larger = smoother

# Collider: flat plane / thin box (you probably won't collide with seabed often)
COLLIDER_THICKNESS = 0.05


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def get_or_create_seabed_ripple_gn(group_name: str):
    """
    Geometry Nodes group that displaces Z to create sand ripples,
    with a seam guard so tiles stitch cleanly.
    """
    ng = bpy.data.node_groups.get(group_name)
    if ng is not None:
        return ng

    ng = bpy.data.node_groups.new(group_name, 'GeometryNodeTree')
    nodes = ng.nodes
    links = ng.links
    nodes.clear()

    # Group I/O
    n_in = nodes.new("NodeGroupInput")
    n_in.location = (-900, 0)
    n_out = nodes.new("NodeGroupOutput")
    n_out.location = (900, 0)

    # Inputs
    ng.interface.new_socket(name="Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket(name="TileSize", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="SeamGuard", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="Strength", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="RippleFreq", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="Distortion", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="BreakupScale", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="BigWaveStrength", in_out='INPUT', socket_type='NodeSocketFloat')
    ng.interface.new_socket(name="BigWaveScale", in_out='INPUT', socket_type='NodeSocketFloat')

    ng.interface.new_socket(name="Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    # Nodes
    n_pos = nodes.new("GeometryNodeInputPosition")
    n_pos.location = (-700, 120)

    n_sep = nodes.new("ShaderNodeSeparateXYZ")
    n_sep.location = (-520, 120)
    links.new(n_pos.outputs["Position"], n_sep.inputs["Vector"])

    # Seam mask: mask = step(seam, x) * step(seam, y) * step(seam, tile-x) * step(seam, tile-y)
    n_tile_minus_x = nodes.new("ShaderNodeMath"); n_tile_minus_x.operation = 'SUBTRACT'
    n_tile_minus_x.location = (-520, -40)
    links.new(n_in.outputs["TileSize"], n_tile_minus_x.inputs[0])
    links.new(n_sep.outputs["X"], n_tile_minus_x.inputs[1])

    n_tile_minus_y = nodes.new("ShaderNodeMath"); n_tile_minus_y.operation = 'SUBTRACT'
    n_tile_minus_y.location = (-520, -120)
    links.new(n_in.outputs["TileSize"], n_tile_minus_y.inputs[0])
    links.new(n_sep.outputs["Y"], n_tile_minus_y.inputs[1])

    def step_node(x_input, edge_input, loc):
        # step(edge, x) ~= clamp((x-edge)*1e6,0,1) but use Compare node for clarity
        c = nodes.new("FunctionNodeCompare")
        c.data_type = 'FLOAT'
        c.operation = 'GREATER_THAN'
        c.location = loc
        links.new(x_input, c.inputs[0])
        links.new(edge_input, c.inputs[1])
        return c

    c_x0 = step_node(n_sep.outputs["X"], n_in.outputs["SeamGuard"], (-300, 80))
    c_y0 = step_node(n_sep.outputs["Y"], n_in.outputs["SeamGuard"], (-300, 20))
    c_x1 = step_node(n_tile_minus_x.outputs[0], n_in.outputs["SeamGuard"], (-300, -40))
    c_y1 = step_node(n_tile_minus_y.outputs[0], n_in.outputs["SeamGuard"], (-300, -100))

    n_mul1 = nodes.new("ShaderNodeMath"); n_mul1.operation = 'MULTIPLY'
    n_mul1.location = (-120, 60)
    links.new(c_x0.outputs["Result"], n_mul1.inputs[0])
    links.new(c_y0.outputs["Result"], n_mul1.inputs[1])

    n_mul2 = nodes.new("ShaderNodeMath"); n_mul2.operation = 'MULTIPLY'
    n_mul2.location = (-120, -20)
    links.new(c_x1.outputs["Result"], n_mul2.inputs[0])
    links.new(c_y1.outputs["Result"], n_mul2.inputs[1])

    n_mask = nodes.new("ShaderNodeMath"); n_mask.operation = 'MULTIPLY'
    n_mask.location = (60, 20)
    links.new(n_mul1.outputs[0], n_mask.inputs[0])
    links.new(n_mul2.outputs[0], n_mask.inputs[1])

    # Breakup noise (procedural)
    n_noise = nodes.new("ShaderNodeTexNoise")
    n_noise.location = (-520, 260)
    n_noise.inputs["Detail"].default_value = 2.0
    n_noise.inputs["Roughness"].default_value = 0.5
    links.new(n_pos.outputs["Position"], n_noise.inputs["Vector"])
    links.new(n_in.outputs["BreakupScale"], n_noise.inputs["Scale"])

    # Distortion term: (noise - 0.5) * Distortion
    n_noise_center = nodes.new("ShaderNodeMath"); n_noise_center.operation = 'SUBTRACT'
    n_noise_center.location = (-300, 260)
    links.new(n_noise.outputs["Fac"], n_noise_center.inputs[0])
    n_noise_center.inputs[1].default_value = 0.5

    n_dist = nodes.new("ShaderNodeMath"); n_dist.operation = 'MULTIPLY'
    n_dist.location = (-120, 260)
    links.new(n_noise_center.outputs[0], n_dist.inputs[0])
    links.new(n_in.outputs["Distortion"], n_dist.inputs[1])

    # Ripple phase: X * RippleFreq + distortion
    n_x_freq = nodes.new("ShaderNodeMath"); n_x_freq.operation = 'MULTIPLY'
    n_x_freq.location = (-300, 140)
    links.new(n_sep.outputs["X"], n_x_freq.inputs[0])
    links.new(n_in.outputs["RippleFreq"], n_x_freq.inputs[1])

    n_phase = nodes.new("ShaderNodeMath"); n_phase.operation = 'ADD'
    n_phase.location = (-120, 140)
    links.new(n_x_freq.outputs[0], n_phase.inputs[0])
    links.new(n_dist.outputs[0], n_phase.inputs[1])

    # Sine -> ripples
    n_sin = nodes.new("ShaderNodeMath"); n_sin.operation = 'SINE'
    n_sin.location = (60, 140)
    links.new(n_phase.outputs[0], n_sin.inputs[0])

    # Big wave (very low frequency)
    n_big_noise = nodes.new("ShaderNodeTexNoise")
    n_big_noise.location = (-520, 420)
    n_big_noise.inputs["Detail"].default_value = 1.0
    n_big_noise.inputs["Roughness"].default_value = 0.4
    links.new(n_pos.outputs["Position"], n_big_noise.inputs["Vector"])
    links.new(n_in.outputs["BigWaveScale"], n_big_noise.inputs["Scale"])

    n_big_center = nodes.new("ShaderNodeMath"); n_big_center.operation = 'SUBTRACT'
    n_big_center.location = (-300, 420)
    links.new(n_big_noise.outputs["Fac"], n_big_center.inputs[0])
    n_big_center.inputs[1].default_value = 0.5

    n_big_amp = nodes.new("ShaderNodeMath"); n_big_amp.operation = 'MULTIPLY'
    n_big_amp.location = (-120, 420)
    links.new(n_big_center.outputs[0], n_big_amp.inputs[0])
    links.new(n_in.outputs["BigWaveStrength"], n_big_amp.inputs[1])

    # Total displacement: (sin * Strength + big) * mask
    n_sin_amp = nodes.new("ShaderNodeMath"); n_sin_amp.operation = 'MULTIPLY'
    n_sin_amp.location = (240, 140)
    links.new(n_sin.outputs[0], n_sin_amp.inputs[0])
    links.new(n_in.outputs["Strength"], n_sin_amp.inputs[1])

    n_sum = nodes.new("ShaderNodeMath"); n_sum.operation = 'ADD'
    n_sum.location = (420, 220)
    links.new(n_sin_amp.outputs[0], n_sum.inputs[0])
    links.new(n_big_amp.outputs[0], n_sum.inputs[1])

    n_apply_mask = nodes.new("ShaderNodeMath"); n_apply_mask.operation = 'MULTIPLY'
    n_apply_mask.location = (600, 220)
    links.new(n_sum.outputs[0], n_apply_mask.inputs[0])
    links.new(n_mask.outputs[0], n_apply_mask.inputs[1])

    # Set Position: add (0,0,disp) to pos
    n_combine = nodes.new("ShaderNodeCombineXYZ")
    n_combine.location = (600, 60)
    links.new(n_apply_mask.outputs[0], n_combine.inputs["Z"])

    n_add_vec = nodes.new("ShaderNodeVectorMath"); n_add_vec.operation = 'ADD'
    n_add_vec.location = (760, 120)
    links.new(n_pos.outputs["Position"], n_add_vec.inputs[0])
    links.new(n_combine.outputs["Vector"], n_add_vec.inputs[1])

    n_setpos = nodes.new("GeometryNodeSetPosition")
    n_setpos.location = (760, -40)
    links.new(n_in.outputs["Geometry"], n_setpos.inputs["Geometry"])
    links.new(n_add_vec.outputs["Vector"], n_setpos.inputs["Position"])

    links.new(n_setpos.outputs["Geometry"], n_out.inputs["Geometry"])

    return ng

def add_ripple_geo_nodes(obj, tile_size, seam_guard, strength, ripple_freq,
                         distortion, breakup_scale, big_strength, big_scale):
    ng = get_or_create_seabed_ripple_gn("GN_SeabedRipples")
    mod = obj.modifiers.new(name="GN_RIPPLES", type='NODES')
    mod.node_group = ng

    # Assign inputs by name (stable)
    def set_input(name, value):
        # Geometry input is implicit
        idx = None
        for i, s in enumerate(ng.interface.items_tree):
            pass

    # In Blender 5.x, modifier inputs can be set via mod["Input_x"] keys,
    # but those keys are not stable across versions. Safer approach:
    # set defaults on the node group sockets (interface).
    # We'll set socket default values directly:
    for sock in ng.interface.items_tree:
        if getattr(sock, "in_out", None) != 'INPUT':
            continue
        if sock.name == "TileSize": sock.default_value = tile_size
        if sock.name == "SeamGuard": sock.default_value = seam_guard
        if sock.name == "Strength": sock.default_value = strength
        if sock.name == "RippleFreq": sock.default_value = ripple_freq
        if sock.name == "Distortion": sock.default_value = distortion
        if sock.name == "BreakupScale": sock.default_value = breakup_scale
        if sock.name == "BigWaveStrength": sock.default_value = big_strength
        if sock.name == "BigWaveScale": sock.default_value = big_scale

    return mod

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

def wipe_collection(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return

    ensure_object_mode()
    objs = list(col.objects)
    if objs:
        deselect_all()
        for o in objs:
            o.select_set(True)
        bpy.ops.object.delete()

    for parent_col in bpy.data.collections:
        if col.name in parent_col.children.keys():
            parent_col.children.unlink(col)

    sc = bpy.context.scene.collection
    if col.name in sc.children.keys():
        sc.children.unlink(col)

    bpy.data.collections.remove(col)

def create_collection(name: str):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col

def link_only_to_collection(obj: bpy.types.Object, col: bpy.types.Collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)

def set_active(obj):
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
    bpy.ops.object.shade_auto_smooth(use_auto_smooth=True, angle=math.radians(angle_deg))
    obj.select_set(False)

def apply_modifiers_for_export(obj: bpy.types.Object):
    ensure_object_mode()
    deselect_all()
    obj.select_set(True)
    set_active(obj)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)


# ------------------------------------------------------------
# Mesh creation: grid plane spanning 0..S in X and Y
# ------------------------------------------------------------
def create_grid_plane_mesh(mesh_name: str, grid_res: int):
    """
    Creates a subdivided plane with (grid_res x grid_res) quads,
    spanning X:0..S, Y:0..S.
    """
    mesh = bpy.data.meshes.new(mesh_name)
    bm = bmesh.new()

    # Create a unit grid centered at origin, then scale/translate
    bmesh.ops.create_grid(
        bm,
        x_segments=grid_res,
        y_segments=grid_res,
        size=0.5  # grid spans approx -0.5..+0.5 in both axes
    )

    # Scale to S and move to 0..S
    for v in bm.verts:
        v.co.x = (v.co.x + 0.5) * S
        v.co.y = (v.co.y + 0.5) * S
        v.co.z = 0.0

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    return mesh

def create_object_from_mesh(obj_name: str, mesh: bpy.types.Mesh, col: bpy.types.Collection):
    obj = bpy.data.objects.new(obj_name, mesh)
    link_only_to_collection(obj, col)
    obj.location = (0.0, 0.0, 0.0)
    add_custom_props(obj, "visual_lod")
    return obj


# ------------------------------------------------------------
# Seam-safe displacement mask:
# - weight 1 in interior
# - weight 0 near all borders (within END_SEAM_GUARD)
# keeps tile edges flat for perfect tiling.
# ------------------------------------------------------------
def add_displace_mask_vertex_group(obj: bpy.types.Object, group_name="DISPLACE_MASK"):
    vg = obj.vertex_groups.new(name=group_name)

    for i, v in enumerate(obj.data.vertices):
        x, y, z = v.co.x, v.co.y, v.co.z

        if (x < END_SEAM_GUARD or x > (S - END_SEAM_GUARD) or
            y < END_SEAM_GUARD or y > (S - END_SEAM_GUARD)):
            w = 0.0
        else:
            w = 1.0

        if w > 0.0:
            vg.add([i], w, 'REPLACE')

    return vg


# ------------------------------------------------------------
# Textures + modifiers
# ------------------------------------------------------------
def get_or_create_wave(tex_name: str, scale: float, distortion: float):
    """
    Produces sand-ripple bands. Not 'tileable' by itself, but our seam guard keeps borders flat,
    so tiles still stitch perfectly.
    """
    tex = bpy.data.textures.get(tex_name)
    if tex is None:
        tex = bpy.data.textures.new(tex_name, type='WAVE')

    tex.wave_type = 'BANDS'          # ripples
    tex.bands_direction = 'Y'        # ripples perpendicular to +Y by default (adjust via object rotation if desired)
    tex.use_wave_add = False
    tex.use_normal_map = False

    tex.noise_scale = scale          # wavelength-ish control
    tex.nabla = 0.03                 # sharpness of the waves (smaller = crisper, but can alias)
    tex.distortion = distortion      # adds slight irregularity to bands

    return tex

def get_or_create_musgrave(tex_name: str, noise_scale: float, detail: float):
    """
    Procedural Musgrave gives a good seabed feel.
    """
    tex = bpy.data.textures.get(tex_name)
    if tex is None:
        tex = bpy.data.textures.new(tex_name, type='MUSGRAVE')
    tex.noise_scale = noise_scale
    tex.musgrave_type = 'FBM'
    tex.dimension_max = detail  # "detail"/fractal dimension
    return tex

def get_or_create_clouds(tex_name: str, noise_scale: float):
    tex = bpy.data.textures.get(tex_name)
    if tex is None:
        tex = bpy.data.textures.new(tex_name, type='CLOUDS')
    tex.noise_scale = noise_scale
    tex.cloud_type = 'GRAYSCALE'
    return tex

def add_seabed_modifiers(obj: bpy.types.Object, lod_key: str):
    s = LOD_SETTINGS[lod_key]
    strength = float(s["disp_strength"])
    if strength <= 0.0:
        return


    if PRESET == "harbor":
        ripple_freq = 2.4 if lod_key == "lod0" else 2.0
        distortion = 1.6 if lod_key == "lod0" else 1.2
        breakup_scale = 0.35
        big_strength = 0.06
        big_scale = 2.8

    else:  # deep
        # Mostly kill the periodic ripples: lower freq + much lower strength, more breakup
        ripple_freq = 0.7 if lod_key == "lod0" else 0.5
        distortion = 2.6 if lod_key == "lod0" else 2.0
        breakup_scale = 0.18
        big_strength = 0.14
        big_scale = 1.6

        # Also reduce the fine ripple contribution by scaling Strength down
        strength *= 0.35

    add_ripple_geo_nodes(
        obj,
        tile_size=S,
        seam_guard=END_SEAM_GUARD,
        strength=strength,
        ripple_freq=ripple_freq,
        distortion=distortion,
        breakup_scale=breakup_scale,
        big_strength=big_strength,
        big_scale=big_scale,
    )

# ------------------------------------------------------------
# Collider + Snap points
# ------------------------------------------------------------
def create_collider(col: bpy.types.Collection):
    """
    Thin box that matches tile footprint.
    """
    mesh = bpy.data.meshes.new(f"COLLIDER_{ASSET_BASE_NAME}_mesh")
    bm = bmesh.new()

    z0 = -COLLIDER_THICKNESS
    z1 = 0.0

    v0 = bm.verts.new((0.0, 0.0, z0))
    v1 = bm.verts.new((S,   0.0, z0))
    v2 = bm.verts.new((S,   S,   z0))
    v3 = bm.verts.new((0.0, S,   z0))

    v4 = bm.verts.new((0.0, 0.0, z1))
    v5 = bm.verts.new((S,   0.0, z1))
    v6 = bm.verts.new((S,   S,   z1))
    v7 = bm.verts.new((0.0, S,   z1))

    bm.faces.new((v0, v1, v2, v3))
    bm.faces.new((v7, v6, v5, v4))
    bm.faces.new((v0, v4, v5, v1))
    bm.faces.new((v1, v5, v6, v2))
    bm.faces.new((v2, v6, v7, v3))
    bm.faces.new((v3, v7, v4, v0))

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
    e.empty_display_size = 0.8
    e.location = location
    link_only_to_collection(e, col)
    add_custom_props(e, "snap_point")
    return e


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------
def main():
    ensure_units_meters()

    wipe_collection(COLLECTION_NAME)
    col = create_collection(COLLECTION_NAME)

    # LOD2 (flat-ish)
    mesh2 = create_grid_plane_mesh(f"{ASSET_BASE_NAME}_lod2_mesh", LOD_SETTINGS["lod2"]["grid"])
    lod2 = create_object_from_mesh(f"{ASSET_BASE_NAME}_lod2", mesh2, col)
    lod2["lod"] = 2
    shade_smooth_auto(lod2, 30.0)

    # LOD1
    mesh1 = create_grid_plane_mesh(f"{ASSET_BASE_NAME}_lod1_mesh", LOD_SETTINGS["lod1"]["grid"])
    lod1 = create_object_from_mesh(f"{ASSET_BASE_NAME}_lod1", mesh1, col)
    lod1["lod"] = 1
    add_seabed_modifiers(lod1, "lod1")
    apply_modifiers_for_export(lod1)
    shade_smooth_auto(lod1, 35.0)

    # LOD0
    mesh0 = create_grid_plane_mesh(f"{ASSET_BASE_NAME}_lod0_mesh", LOD_SETTINGS["lod0"]["grid"])
    lod0 = create_object_from_mesh(f"{ASSET_BASE_NAME}_lod0", mesh0, col)
    lod0["lod"] = 0
    add_seabed_modifiers(lod0, "lod0")
    apply_modifiers_for_export(lod0)
    shade_smooth_auto(lod0, 35.0)

    # Parent under LOD0 (optional organization)
    lod1.parent = lod0
    lod2.parent = lod0

    # Collider
    collider = create_collider(col)
    collider.parent = lod0

    # Snap corners (tile grid placement)
    snap00 = create_snap_empty(f"SNAP_00_{ASSET_BASE_NAME}", (0.0, 0.0, 0.0), col)
    snap10 = create_snap_empty(f"SNAP_10_{ASSET_BASE_NAME}", (S,   0.0, 0.0), col)
    snap01 = create_snap_empty(f"SNAP_01_{ASSET_BASE_NAME}", (0.0, S,   0.0), col)
    snap11 = create_snap_empty(f"SNAP_11_{ASSET_BASE_NAME}", (S,   S,   0.0), col)

    for s in (snap00, snap10, snap01, snap11):
        s.parent = lod0

    print(f"Created seabed tile kit '{ASSET_BASE_NAME}' in collection '{COLLECTION_NAME}'.")

if __name__ == "__main__":
    main()
