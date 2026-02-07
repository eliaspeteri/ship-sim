import bpy
import math
from typing import List, Tuple

# ============================================================
# Gangway Kit (Blender 5.0+)
# Conventions:
#   - Units: meters (1 BU = 1m)
#   - Z up
#   - Forward along +Y
#   - Pivot at start-face center on ground plane: (0,0,0)
# ============================================================

COLLECTION_NAME = "GangwayKit"
FORWARD_AXIS = "+Y"
ASSET_TYPE = "gangway"

LOD_RATIOS = [
    ("lod1", 0.55),
    ("lod2", 0.28),
]

# Base dimensions
DEFAULT_WIDTH = 1.4
DEFAULT_CLEARANCE = 0.08
RAIL_POST_SPACING = 1.2
RAIL_POST_W = 0.05
RAIL_TOP_H = 1.05

PRESETS = [
    {"name": "gangway_ramp_6m_10deg_rail", "kind": "ramp", "length": 6.0, "angle_deg": 10.0, "width": 1.4, "rails": True, "enabled": True},
    {"name": "gangway_ramp_8m_12deg_rail", "kind": "ramp", "length": 8.0, "angle_deg": 12.0, "width": 1.6, "rails": True, "enabled": True},
    {"name": "gangway_ramp_6m_10deg_noRail", "kind": "ramp", "length": 6.0, "angle_deg": 10.0, "width": 1.4, "rails": False, "enabled": True},
    {"name": "gangway_platform_2x2", "kind": "platform", "length": 2.0, "width": 2.0, "rails": True, "enabled": True},
    {"name": "gangway_landing_3x2", "kind": "platform", "length": 3.0, "width": 2.0, "rails": True, "enabled": True},
]


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


def purge_gangway_objects():
    prefixes = ("gangway_", "COLLIDER_gangway_", "SNAP_")
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


def get_or_create_material(name: str, color: Tuple[float, float, float, float], roughness=0.6, metallic=0.0):
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
        bsdf.inputs["Base Color"].default_value = color
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


def add_box_part(name: str, dims: Tuple[float, float, float], location: Tuple[float, float, float],
                 col: bpy.types.Collection, rot: Tuple[float, float, float] = (0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
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


def create_snap_empty(name: str, location: Tuple[float, float, float], parent: bpy.types.Object, col: bpy.types.Collection):
    deselect_all()
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=location)
    e = bpy.context.active_object
    e.name = name
    add_custom_props(e, "snap_point")
    e.parent = parent
    e.matrix_parent_inverse = parent.matrix_world.inverted()
    force_into_collection(e, col)
    return e


def create_collider_from_bounds(parent: bpy.types.Object, base_name: str, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(parent)
    sx = max_x - min_x
    sy = max_y - min_y
    sz = max_z - min_z
    cx = (min_x + max_x) * 0.5
    cy = (min_y + max_y) * 0.5
    cz = (min_z + max_z) * 0.5

    collider = add_box_part(f"COLLIDER_{base_name}", (sx, sy, sz), (cx, cy, cz), col)
    add_custom_props(collider, "collision")
    collider.parent = parent
    collider.matrix_parent_inverse = parent.matrix_world.inverted()
    collider.display_type = "WIRE"
    collider.hide_render = True
    return collider


def duplicate_with_decimate(src: bpy.types.Object, new_name: str, ratio: float, col: bpy.types.Collection):
    dup = src.copy()
    dup.data = src.data.copy()
    dup.name = new_name
    bpy.context.collection.objects.link(dup)
    force_into_collection(dup, col)

    dec = dup.modifiers.new(name="Decimate", type="DECIMATE")
    dec.ratio = ratio

    bpy.context.view_layer.objects.active = dup
    dup.select_set(True)
    bpy.ops.object.convert(target="MESH")
    dup.select_set(False)

    add_custom_props(dup, "visual_lod")
    return dup


# ------------------------------------------------------------
# Builders
# ------------------------------------------------------------
def add_rails(parts: List[bpy.types.Object], prefix: str, width: float, length: float, rise: float,
              thickness: float, col: bpy.types.Collection):
    # Top rails along both sides, following ramp slope.
    angle = math.atan2(rise, length) if length > 0.0 else 0.0
    rail_len = max(0.2, math.sqrt(length * length + rise * rise))

    for sx in (-1.0, 1.0):
        x = sx * (width * 0.5 - RAIL_POST_W * 0.5)
        y = length * 0.5
        z = thickness + RAIL_TOP_H + (rise * 0.5)
        rail = add_box_part(
            f"{prefix}__rail_top",
            (RAIL_POST_W * 0.6, rail_len, RAIL_POST_W * 0.6),
            (x, y, z),
            col,
            rot=(angle, 0.0, 0.0),
        )
        parts.append(rail)

    # Posts
    post_count = max(2, int(length / RAIL_POST_SPACING) + 1)
    for i in range(post_count):
        t = i / (post_count - 1)
        y = t * length
        z_base = thickness + t * rise
        for sx in (-1.0, 1.0):
            x = sx * (width * 0.5 - RAIL_POST_W * 0.5)
            post = add_box_part(
                f"{prefix}__post",
                (RAIL_POST_W * 0.5, RAIL_POST_W * 0.5, RAIL_TOP_H * 0.5),
                (x, y, z_base + RAIL_TOP_H * 0.5),
                col,
            )
            parts.append(post)


def build_ramp(base_name: str, length: float, angle_deg: float, width: float,
               rails: bool, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []
    angle = math.radians(angle_deg)
    rise = math.tan(angle) * length

    # Main deck (sloped)
    deck = add_box_part(
        f"{base_name}__deck",
        (width * 0.9, length, DEFAULT_CLEARANCE * 0.5),
        (0.0, length * 0.5, DEFAULT_CLEARANCE + rise * 0.5),
        col,
        rot=(angle, 0.0, 0.0),
    )
    parts.append(deck)

    # Side stringers
    for sx in (-1.0, 1.0):
        stringer = add_box_part(
            f"{base_name}__stringer",
            (0.08, length, 0.08),
            (sx * (width * 0.5 - 0.05), length * 0.5, 0.08 + rise * 0.5),
            col,
            rot=(angle, 0.0, 0.0),
        )
        parts.append(stringer)

    # End plates
    start_plate = add_box_part(f"{base_name}__start_plate", (width, 0.06, 0.03), (0.0, 0.03, 0.02), col)
    end_plate = add_box_part(f"{base_name}__end_plate", (width, 0.06, 0.03), (0.0, length - 0.03, rise + 0.02), col)
    parts.extend([start_plate, end_plate])

    if rails:
        add_rails(parts, base_name, width, length, rise, DEFAULT_CLEARANCE, col)

    obj = join_and_name(parts, base_name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Gangway_Metal", (0.44, 0.47, 0.49, 1.0), 0.55, 0.25))
    return obj


def build_platform(base_name: str, length: float, width: float, rails: bool, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []

    deck = add_box_part(
        f"{base_name}__deck",
        (width, length, DEFAULT_CLEARANCE * 0.5),
        (0.0, length * 0.5, DEFAULT_CLEARANCE),
        col,
    )
    parts.append(deck)

    # Legs
    for sx in (-1.0, 1.0):
        for sy in (0.0, length):
            leg = add_box_part(
                f"{base_name}__leg",
                (0.06, 0.06, 1.5),
                (sx * (width * 0.5), sy, 0.82),
                col,
            )
            parts.append(leg)

    if rails:
        # Flat perimeter rails
        rail_h = DEFAULT_CLEARANCE + RAIL_TOP_H
        r_t = RAIL_POST_W * 0.5

        left = add_box_part(f"{base_name}__rail_l", (r_t, length, r_t), (-width * 0.5 + r_t, length * 0.5, rail_h), col)
        right = add_box_part(f"{base_name}__rail_r", (r_t, length, r_t), (width * 0.5 - r_t, length * 0.5, rail_h), col)
        rear = add_box_part(f"{base_name}__rail_rear", (width, r_t, r_t), (0.0, length - r_t, rail_h), col)
        parts.extend([left, right, rear])

    obj = join_and_name(parts, base_name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Gangway_Metal", (0.44, 0.47, 0.49, 1.0), 0.55, 0.25))
    return obj


def add_snaps(base_name: str, lod0: bpy.types.Object, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(lod0)
    cx = (min_x + max_x) * 0.5
    create_snap_empty(f"SNAP_START_{base_name}", (cx, min_y, min_z), lod0, col)
    create_snap_empty(f"SNAP_END_{base_name}", (cx, max_y, min_z), lod0, col)
    create_snap_empty(f"SNAP_TOP_{base_name}", (cx, max_y, max_z), lod0, col)


def build_asset_with_lods(defn: dict, col: bpy.types.Collection):
    name = defn["name"]
    kind = defn["kind"]

    if kind == "ramp":
        lod0 = build_ramp(name + "_lod0", defn["length"], defn["angle_deg"], defn["width"], defn["rails"], col)
    else:
        lod0 = build_platform(name + "_lod0", defn["length"], defn["width"], defn["rails"], col)

    lod0["asset_name"] = name
    lod0["lod"] = 0

    for lod_name, ratio in LOD_RATIOS:
        lod = duplicate_with_decimate(lod0, f"{name}_{lod_name}", ratio, col)
        lod["asset_name"] = name
        lod["lod"] = int(lod_name[-1])
        lod.parent = lod0
        lod.matrix_parent_inverse = lod0.matrix_world.inverted()

    create_collider_from_bounds(lod0, name, col)
    add_snaps(name, lod0, col)


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------
def main():
    ensure_units_meters()
    purge_gangway_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    created = 0
    for defn in PRESETS:
        if not defn.get("enabled", True):
            continue
        build_asset_with_lods(defn, col)
        created += 1

    print(f"Created {created} gangway assets in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
