import bpy
import math
from typing import Dict, List, Tuple

# ============================================================
# Warehouse Kit (Blender 5.0+)
# Conventions:
#   - Units: meters (1 BU = 1m)
#   - Z up
#   - Forward along +Y
#   - Pivot at start-face center on ground: (0,0,0)
# ============================================================

COLLECTION_NAME = "WarehouseKit"
FORWARD_AXIS = "+Y"
ASSET_TYPE = "warehouse"
EXPORT_MODE = "all"  # "all" | "modules_only" | "presets_only"

WALL_HEIGHT = 7.0
WALL_THICKNESS = 0.24
ROOF_THICKNESS = 0.18
FRAME_W = 0.18
ROLLER_DOOR_HEIGHT = 5.0

LOD_SETTINGS = {
    "lod0": {"rib_spacing": 1.35, "rib_depth": 0.06, "roof_seam_spacing": 1.4, "door_slats": 12},
    "lod1": {"rib_spacing": 2.4, "rib_depth": 0.04, "roof_seam_spacing": 2.8, "door_slats": 6},
    "lod2": {"rib_spacing": 0.0, "rib_depth": 0.0, "roof_seam_spacing": 0.0, "door_slats": 0},
}

MODULES = [
    {"name": "warehouse_wall_6m", "kind": "wall", "length": 6.0, "enabled": True},
    {"name": "warehouse_wall_12m", "kind": "wall", "length": 12.0, "enabled": True},
    {"name": "warehouse_roof_flat_6m", "kind": "roof", "length": 6.0, "enabled": True},
    {"name": "warehouse_roller_door_single", "kind": "door", "width": 4.0, "enabled": True},
    {"name": "warehouse_roller_door_double", "kind": "door", "width": 7.0, "enabled": True},
    {"name": "warehouse_roller_door_single_open", "kind": "door", "width": 4.0, "open": True, "enabled": True},
    {"name": "warehouse_roller_door_double_open", "kind": "door", "width": 7.0, "open": True, "enabled": True},
]

PRESETS = [
    {"name": "warehouse_small_12x18", "kind": "preset", "width": 12.0, "length": 18.0, "door_count": 1, "enabled": True},
    {"name": "warehouse_medium_24x30", "kind": "preset", "width": 24.0, "length": 30.0, "door_count": 2, "enabled": True},
]

BOOLEAN_OVERLAP_EPS = 0.002


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def ensure_units_meters():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def deselect_all():
    for obj in bpy.context.selected_objects:
        obj.select_set(False)


def get_or_create_collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def force_into_collection(obj: bpy.types.Object, col: bpy.types.Collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


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

    for scene in bpy.data.scenes:
        if col.name in scene.collection.children.keys():
            scene.collection.children.unlink(col)

    for parent_col in bpy.data.collections:
        if col.name in parent_col.children.keys():
            parent_col.children.unlink(col)

    bpy.data.collections.remove(col)


def purge_warehouse_objects():
    prefixes = (f"{ASSET_TYPE}_", "COLLIDER_", "SNAP_")
    ensure_object_mode()
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def add_custom_props(obj: bpy.types.Object, asset_role: str):
    obj["asset_role"] = asset_role
    obj["units"] = "meters"
    obj["forward_axis"] = FORWARD_AXIS


def shade_smooth_with_autosmooth(obj: bpy.types.Object, angle_deg: float = 35.0):
    if obj.type != "MESH":
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.shade_auto_smooth(use_auto_smooth=True, angle=math.radians(angle_deg))
    obj.select_set(False)


def get_or_create_material(name: str, base_color: Tuple[float, float, float, float], roughness: float, metallic: float = 0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        for n in list(nodes):
            nodes.remove(n)
        output = nodes.new(type="ShaderNodeOutputMaterial")
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat


def assign_material(obj: bpy.types.Object, mat: bpy.types.Material):
    if obj.type != "MESH":
        return
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat


def add_box_part(name: str, dims: Tuple[float, float, float], loc: Tuple[float, float, float], col: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (dims[0], dims[1], dims[2])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    force_into_collection(obj, col)
    return obj


def join_and_name(objs: List[bpy.types.Object], name: str) -> bpy.types.Object:
    ensure_object_mode()
    deselect_all()
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    if obj.data:
        obj.data.name = name
    return obj


def bounds_from_mesh(obj: bpy.types.Object):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


def set_origin_start_face_ground(obj: bpy.types.Object):
    min_x, max_x, min_y, _max_y, min_z, _max_z = bounds_from_mesh(obj)
    cx = (min_x + max_x) * 0.5
    for v in obj.data.vertices:
        v.co.x -= cx
        v.co.y -= min_y
        v.co.z -= min_z
    obj.location = (0.0, 0.0, 0.0)


def apply_bevel(obj: bpy.types.Object, width: float):
    if width <= 0.0:
        return
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = 2
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(45.0)


def create_snap_empty(name: str, location: Tuple[float, float, float], parent: bpy.types.Object, col: bpy.types.Collection):
    deselect_all()
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=location)
    snap = bpy.context.active_object
    snap.name = name
    add_custom_props(snap, "snap_point")
    snap.parent = parent
    snap.matrix_parent_inverse = parent.matrix_world.inverted()
    force_into_collection(snap, col)
    return snap


def create_collider_from_bounds(parent: bpy.types.Object, asset_name: str, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(parent)
    sx = max_x - min_x
    sy = max_y - min_y
    sz = max_z - min_z
    cx = (min_x + max_x) * 0.5
    cy = (min_y + max_y) * 0.5
    cz = (min_z + max_z) * 0.5

    collider = add_box_part(f"COLLIDER_{asset_name}", (sx, sy, sz), (cx, cy, cz), col)
    add_custom_props(collider, "collision")
    collider.parent = parent
    collider.matrix_parent_inverse = parent.matrix_world.inverted()
    collider.display_type = "WIRE"
    collider.hide_render = True
    return collider


# ------------------------------------------------------------
# Geometry builders
# ------------------------------------------------------------
def apply_boolean_difference(target: bpy.types.Object, cutters: List[bpy.types.Object], join_name: str):
    if target.type != "MESH" or not cutters:
        return

    ensure_object_mode()
    deselect_all()
    backup_mesh = target.data.copy()
    failed = False

    bpy.context.view_layer.objects.active = target
    target.select_set(True)

    for i, cutter in enumerate(cutters):
        if cutter is None or cutter.type != "MESH":
            continue
        mod = target.modifiers.new(name=f"{join_name}_{i:03d}", type="BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.object = cutter
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError:
            failed = True
            break

    target.select_set(False)

    if failed or len(target.data.polygons) < 6:
        old_mesh = target.data
        target.data = backup_mesh
        if old_mesh and old_mesh.users == 0:
            bpy.data.meshes.remove(old_mesh)
    else:
        if backup_mesh and backup_mesh.users == 0:
            bpy.data.meshes.remove(backup_mesh)

    for cutter in cutters:
        if cutter and cutter.name in bpy.data.objects:
            bpy.data.objects.remove(cutter, do_unlink=True)


def create_vertical_corrugation_cutters(prefix: str, normal_axis: str, repeat_axis: str,
                                        center_x: float, center_y: float,
                                        repeat_min: float, repeat_max: float,
                                        z_min: float, z_max: float,
                                        depth: float, spacing: float,
                                        face_dir: float, thickness: float,
                                        col: bpy.types.Collection) -> List[bpy.types.Object]:
    cutters: List[bpy.types.Object] = []
    if spacing <= 0.0 or depth <= 0.0:
        return cutters

    span = max(0.01, repeat_max - repeat_min)
    count = max(1, int(span / spacing))
    groove_w = min(spacing * 0.45, 0.35)
    groove_h = max(0.25, z_max - z_min)
    groove_t = max(0.01, depth * 1.2)
    zc = z_min + (z_max - z_min) * 0.5

    for i in range(count):
        p = repeat_min + (i + 0.5) * (span / count)

        if normal_axis == "X":
            x = center_x + face_dir * (thickness * 0.5 - groove_t * 0.5 + BOOLEAN_OVERLAP_EPS)
            y = p if repeat_axis == "Y" else center_y
            dims = (groove_t, groove_w if repeat_axis == "Y" else groove_t, groove_h)
            if repeat_axis == "X":
                dims = (groove_w, groove_t, groove_h)
        else:
            y = center_y + face_dir * (thickness * 0.5 - groove_t * 0.5 + BOOLEAN_OVERLAP_EPS)
            x = p if repeat_axis == "X" else center_x
            dims = (groove_w if repeat_axis == "X" else groove_t, groove_t, groove_h)
            if repeat_axis == "Y":
                dims = (groove_t, groove_w, groove_h)

        cutter = add_box_part(
            f"{prefix}__corr_cut_{i:02d}",
            dims,
            (x, y, zc),
            col,
        )
        cutters.append(cutter)

    return cutters


def apply_roof_corrugation(roof_obj: bpy.types.Object, prefix: str, width: float, length: float,
                           spacing: float, depth: float, roof_top_z: float, col: bpy.types.Collection):
    if spacing <= 0.0 or depth <= 0.0:
        return

    count = max(1, int(length / spacing))
    groove_w = min(spacing * 0.45, 0.35)
    groove_t = max(0.01, depth * 1.1)
    cutters: List[bpy.types.Object] = []

    for i in range(count):
        y = (i + 0.5) * (length / count)
        cutters.append(
            add_box_part(
                f"{prefix}__roof_cut_{i:02d}",
                (width - 0.35, groove_w, groove_t),
                (0.0, y, roof_top_z - groove_t * 0.5 + BOOLEAN_OVERLAP_EPS),
                col,
            )
        )

    apply_boolean_difference(roof_obj, cutters, f"{prefix}_roof_corr")


def build_wall_module(asset_name: str, length: float, lod_key: str, col: bpy.types.Collection) -> bpy.types.Object:
    s = LOD_SETTINGS[lod_key]
    parts: List[bpy.types.Object] = []

    wall = add_box_part(
        f"{asset_name}__panel",
        (WALL_THICKNESS, length, WALL_HEIGHT),
        (0.0, length * 0.5, WALL_HEIGHT * 0.5),
        col,
    )
    parts.append(wall)

    cutters = []
    cutters += create_vertical_corrugation_cutters(
        asset_name + "_negx", "X", "Y",
        0.0, length * 0.5, 0.1, length - 0.1, 0.0, WALL_HEIGHT,
        s["rib_depth"], s["rib_spacing"], -1.0, WALL_THICKNESS, col
    )
    cutters += create_vertical_corrugation_cutters(
        asset_name + "_posx", "X", "Y",
        0.0, length * 0.5, 0.1, length - 0.1, 0.0, WALL_HEIGHT,
        s["rib_depth"], s["rib_spacing"], 1.0, WALL_THICKNESS, col
    )
    apply_boolean_difference(wall, cutters, f"{asset_name}_{lod_key}_corr")

    obj = join_and_name(parts, f"{asset_name}_{lod_key}")
    set_origin_start_face_ground(obj)
    apply_bevel(obj, 0.01 if lod_key != "lod2" else 0.0)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    shade_smooth_with_autosmooth(obj, 35.0)
    add_custom_props(obj, "visual" if lod_key == "lod0" else "visual_lod")
    assign_material(obj, get_or_create_material("Warehouse_Wall", (0.36, 0.38, 0.40, 1.0), 0.7, 0.05))
    return obj


def build_roof_module(asset_name: str, length: float, lod_key: str, col: bpy.types.Collection) -> bpy.types.Object:
    s = LOD_SETTINGS[lod_key]
    width = 6.0
    parts: List[bpy.types.Object] = []

    roof = add_box_part(
        f"{asset_name}__roof",
        (width, length, ROOF_THICKNESS),
        (0.0, length * 0.5, ROOF_THICKNESS * 0.5),
        col,
    )
    parts.append(roof)
    apply_roof_corrugation(roof, asset_name, width, length, s["roof_seam_spacing"], s["rib_depth"], ROOF_THICKNESS, col)

    obj = join_and_name(parts, f"{asset_name}_{lod_key}")
    set_origin_start_face_ground(obj)
    apply_bevel(obj, 0.008 if lod_key != "lod2" else 0.0)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    shade_smooth_with_autosmooth(obj, 35.0)
    add_custom_props(obj, "visual" if lod_key == "lod0" else "visual_lod")
    assign_material(obj, get_or_create_material("Warehouse_Roof", (0.25, 0.27, 0.29, 1.0), 0.65, 0.15))
    return obj


def build_roller_door_module(asset_name: str, width: float, lod_key: str, col: bpy.types.Collection, is_open: bool = False) -> bpy.types.Object:
    s = LOD_SETTINGS[lod_key]
    height = ROLLER_DOOR_HEIGHT
    panel_t = 0.10
    frame_t = 0.18
    parts: List[bpy.types.Object] = []

    left = add_box_part(f"{asset_name}__frame_l", (frame_t, panel_t, height), (-width * 0.5 + frame_t * 0.5, panel_t * 0.5, height * 0.5), col)
    right = add_box_part(f"{asset_name}__frame_r", (frame_t, panel_t, height), (width * 0.5 - frame_t * 0.5, panel_t * 0.5, height * 0.5), col)
    top = add_box_part(f"{asset_name}__frame_t", (width, panel_t, frame_t), (0.0, panel_t * 0.5, height - frame_t * 0.5), col)
    if is_open:
        # Park shutter at the top to create a clear opening to the ground.
        shutter_h = (height - frame_t) * 0.28
        shutter_z = height - frame_t - shutter_h * 0.5
    else:
        shutter_h = height - frame_t
        shutter_z = shutter_h * 0.5
    shutter = add_box_part(
        f"{asset_name}__shutter",
        (width - frame_t * 2.0, panel_t, shutter_h),
        (0.0, panel_t * 0.5, shutter_z),
        col,
    )
    parts.extend([left, right, top, shutter])

    corr_count = int(s["door_slats"])
    if corr_count > 0 and s["rib_depth"] > 0.0:
        z_min = shutter_z - (shutter_h * 0.5) + 0.08
        z_max = shutter_z + (shutter_h * 0.5) - 0.08
        groove_t = max(0.01, s["rib_depth"] * 0.9)
        groove_h = max(0.03, (z_max - z_min) / max(1, corr_count * 2))
        groove_w = width - frame_t * 2.2
        cutters: List[bpy.types.Object] = []
        for i in range(corr_count):
            z = z_min + (i + 0.5) * ((z_max - z_min) / corr_count)
            cutters.append(
                add_box_part(
                    f"{asset_name}__shutter_hcorr_cut_{i:02d}",
                    (groove_w, groove_t, groove_h),
                    (0.0, groove_t * 0.5 - BOOLEAN_OVERLAP_EPS, z),
                    col,
                )
            )
        apply_boolean_difference(shutter, cutters, f"{asset_name}_{lod_key}_shutter_corr")

    obj = join_and_name(parts, f"{asset_name}_{lod_key}")
    set_origin_start_face_ground(obj)
    apply_bevel(obj, 0.007 if lod_key != "lod2" else 0.0)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    shade_smooth_with_autosmooth(obj, 35.0)
    add_custom_props(obj, "visual" if lod_key == "lod0" else "visual_lod")
    assign_material(obj, get_or_create_material("Warehouse_Door", (0.42, 0.44, 0.46, 1.0), 0.55, 0.2))
    return obj


def build_preset_warehouse(asset_name: str, width: float, length: float, door_count: int, lod_key: str,
                           col: bpy.types.Collection) -> bpy.types.Object:
    s = LOD_SETTINGS[lod_key]
    parts: List[bpy.types.Object] = []

    half_w = width * 0.5
    t = WALL_THICKNESS

    # Four perimeter walls.
    front = add_box_part(f"{asset_name}__front", (width, t, WALL_HEIGHT), (0.0, t * 0.5, WALL_HEIGHT * 0.5), col)
    back = add_box_part(f"{asset_name}__back", (width, t, WALL_HEIGHT), (0.0, length - t * 0.5, WALL_HEIGHT * 0.5), col)
    left = add_box_part(f"{asset_name}__left", (t, length, WALL_HEIGHT), (-half_w + t * 0.5, length * 0.5, WALL_HEIGHT * 0.5), col)
    right = add_box_part(f"{asset_name}__right", (t, length, WALL_HEIGHT), (half_w - t * 0.5, length * 0.5, WALL_HEIGHT * 0.5), col)
    roof = add_box_part(f"{asset_name}__roof", (width, length, ROOF_THICKNESS), (0.0, length * 0.5, WALL_HEIGHT + ROOF_THICKNESS * 0.5), col)
    parts.extend([front, back, left, right, roof])

    # Full-height corrugation recesses on all wall faces.
    if s["rib_spacing"] > 0.0 and s["rib_depth"] > 0.0:
        # Front/back walls (repeat across X)
        fb_cutters = []
        fb_cutters += create_vertical_corrugation_cutters(
            asset_name + "_front_posy", "Y", "X", 0.0, t * 0.5,
            -width * 0.5 + 0.1, width * 0.5 - 0.1, 0.0, WALL_HEIGHT,
            s["rib_depth"], s["rib_spacing"], -1.0, t, col
        )
        apply_boolean_difference(front, fb_cutters, f"{asset_name}_{lod_key}_front_corr")

        bb_cutters = []
        bb_cutters += create_vertical_corrugation_cutters(
            asset_name + "_back_negy", "Y", "X", 0.0, length - t * 0.5,
            -width * 0.5 + 0.1, width * 0.5 - 0.1, 0.0, WALL_HEIGHT,
            s["rib_depth"], s["rib_spacing"], 1.0, t, col
        )
        apply_boolean_difference(back, bb_cutters, f"{asset_name}_{lod_key}_back_corr")

        # Side walls (repeat across Y)
        left_cutters = create_vertical_corrugation_cutters(
            asset_name + "_left_negx", "X", "Y", -half_w + t * 0.5, length * 0.5,
            0.1, length - 0.1, 0.0, WALL_HEIGHT,
            s["rib_depth"], s["rib_spacing"], -1.0, t, col
        )
        right_cutters = create_vertical_corrugation_cutters(
            asset_name + "_right_posx", "X", "Y", half_w - t * 0.5, length * 0.5,
            0.1, length - 0.1, 0.0, WALL_HEIGHT,
            s["rib_depth"], s["rib_spacing"], 1.0, t, col
        )
        apply_boolean_difference(left, left_cutters, f"{asset_name}_{lod_key}_left_corr")
        apply_boolean_difference(right, right_cutters, f"{asset_name}_{lod_key}_right_corr")

    # Front roller-door facades.
    door_w = 4.6
    if door_count <= 1:
        door_xs = [0.0]
    else:
        span = min(width * 0.65, (door_count - 1) * (door_w + 1.5))
        start = -span * 0.5
        door_xs = [start + i * (span / (door_count - 1)) for i in range(door_count)]

    # Cut exact openings in the front wall for roller doors.
    opening_cutters: List[bpy.types.Object] = []
    for i, dx in enumerate(door_xs):
        opening_cutters.append(
            add_box_part(
                f"{asset_name}__opening_cut_{i}",
                (door_w, t + 0.04, ROLLER_DOOR_HEIGHT),
                (dx, t * 0.5, ROLLER_DOOR_HEIGHT * 0.5),
                col,
            )
        )
    apply_boolean_difference(front, opening_cutters, f"{asset_name}_{lod_key}_front_openings")

    for i, dx in enumerate(door_xs):
        door = build_roller_door_module(f"{asset_name}__door{i}", door_w, lod_key, col, is_open=False)
        door.location = (dx, -0.05, 0.0)
        parts.append(door)

    # Rear personnel door (2.0m x 0.6m), attached on back face.
    p_w = 0.6
    p_h = 2.0
    p_t = 0.08
    p_x = (-width * 0.5) + 1.4
    p_y = length - t * 0.5
    p_z = p_h * 0.5

    # Cut a matching opening in rear wall, then place frame/panel flush to exterior.
    p_opening = add_box_part(
        f"{asset_name}__personnel_opening_cut",
        (p_w + 0.02, t + 0.04, p_h + 0.02),
        (p_x, p_y, p_z),
        col,
    )
    apply_boolean_difference(back, [p_opening], f"{asset_name}_{lod_key}_personnel_opening")

    p_face_y = length + p_t * 0.5
    p_frame = add_box_part(f"{asset_name}__personnel_frame", (p_w + 0.12, p_t, p_h + 0.12), (p_x, p_face_y, p_z), col)
    p_panel = add_box_part(f"{asset_name}__personnel_panel", (p_w, p_t, p_h), (p_x, p_face_y, p_z), col)
    parts.extend([p_frame, p_panel])
    if s["rib_depth"] > 0.0:
        band_t = max(0.01, s["rib_depth"] * 0.8)
        pd_cutters = [
            add_box_part(f"{asset_name}__pd_cut_l", (0.06, band_t, p_h - 0.08), (p_x - p_w * 0.5 + 0.05, p_y + 0.01 + band_t * 0.5, p_z), col),
            add_box_part(f"{asset_name}__pd_cut_r", (0.06, band_t, p_h - 0.08), (p_x + p_w * 0.5 - 0.05, p_y + 0.01 + band_t * 0.5, p_z), col),
            add_box_part(f"{asset_name}__pd_cut_t", (p_w - 0.08, band_t, 0.08), (p_x, p_y + 0.01 + band_t * 0.5, p_h - 0.04), col),
        ]
        apply_boolean_difference(p_panel, pd_cutters, f"{asset_name}_{lod_key}_pd_corr")

    apply_roof_corrugation(roof, asset_name + "_roof", width, length, s["roof_seam_spacing"], s["rib_depth"], WALL_HEIGHT + ROOF_THICKNESS, col)

    obj = join_and_name(parts, f"{asset_name}_{lod_key}")
    set_origin_start_face_ground(obj)
    apply_bevel(obj, 0.012 if lod_key != "lod2" else 0.0)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    shade_smooth_with_autosmooth(obj, 35.0)
    add_custom_props(obj, "visual" if lod_key == "lod0" else "visual_lod")
    assign_material(obj, get_or_create_material("Warehouse_Paint", (0.53, 0.55, 0.56, 1.0), 0.72, 0.02))
    return obj


# ------------------------------------------------------------
# Asset assembly
# ------------------------------------------------------------
def add_linear_snaps(asset_name: str, obj: bpy.types.Object, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(obj)
    cx = (min_x + max_x) * 0.5
    create_snap_empty(f"SNAP_START_{asset_name}", (cx, min_y, min_z), obj, col)
    create_snap_empty(f"SNAP_END_{asset_name}", (cx, max_y, min_z), obj, col)
    create_snap_empty(f"SNAP_TOP_{asset_name}", (cx, min_y, max_z), obj, col)
    create_snap_empty(f"SNAP_BOTTOM_{asset_name}", (cx, min_y, min_z), obj, col)


def add_preset_snaps(asset_name: str, obj: bpy.types.Object, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(obj)
    cx = (min_x + max_x) * 0.5
    cy = (min_y + max_y) * 0.5
    create_snap_empty(f"SNAP_FRONT_{asset_name}", (cx, min_y, min_z), obj, col)
    create_snap_empty(f"SNAP_BACK_{asset_name}", (cx, max_y, min_z), obj, col)
    create_snap_empty(f"SNAP_LEFT_{asset_name}", (min_x, cy, min_z), obj, col)
    create_snap_empty(f"SNAP_RIGHT_{asset_name}", (max_x, cy, min_z), obj, col)
    create_snap_empty(f"SNAP_TOP_{asset_name}", (cx, cy, max_z), obj, col)


def build_asset_lods(defn: Dict, col: bpy.types.Collection):
    name = defn["name"]
    kind = defn["kind"]

    built = {}
    for lod in ("lod0", "lod1", "lod2"):
        if kind == "wall":
            obj = build_wall_module(name, defn["length"], lod, col)
        elif kind == "roof":
            obj = build_roof_module(name, defn["length"], lod, col)
        elif kind == "door":
            obj = build_roller_door_module(name, defn["width"], lod, col, is_open=bool(defn.get("open", False)))
        elif kind == "preset":
            obj = build_preset_warehouse(name, defn["width"], defn["length"], defn["door_count"], lod, col)
        else:
            continue

        obj["asset_name"] = name
        obj["lod"] = int(lod[-1])
        obj["asset_kind"] = kind
        built[lod] = obj

    if "lod0" not in built:
        return None

    for lod in ("lod1", "lod2"):
        if lod in built:
            built[lod].parent = built["lod0"]
            built[lod].matrix_parent_inverse = built["lod0"].matrix_world.inverted()

    create_collider_from_bounds(built["lod0"], name, col)
    if kind == "preset":
        add_preset_snaps(name, built["lod0"], col)
    else:
        add_linear_snaps(name, built["lod0"], col)

    return built["lod0"]


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------
def main():
    ensure_units_meters()
    purge_warehouse_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    created = 0

    items = MODULES + PRESETS
    if EXPORT_MODE == "modules_only":
        items = MODULES
    elif EXPORT_MODE == "presets_only":
        items = PRESETS

    for item in items:
        if not item.get("enabled", True):
            continue
        root = build_asset_lods(item, col)
        if root:
            created += 1

    print(f"Created {created} warehouse assets in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
