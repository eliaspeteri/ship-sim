import bpy
import math
from typing import List, Tuple

# ============================================================
# Crane Kit (Blender 5.0+)
# Focus: Ship-to-Shore (STS) Container Cranes
# Conventions:
#   - Units: meters (1 BU = 1m)
#   - Z up
#   - Forward along +Y
#   - Pivot at start face center on ground plane: (0,0,0)
# ============================================================

COLLECTION_NAME = "CraneKit"
FORWARD_AXIS = "+Y"
ASSET_TYPE = "crane"

LOD_RATIOS = [
    ("lod1", 0.55),
    ("lod2", 0.25),
]

# Typical STS proportions informed by ~231 ft boom class (~70.4 m)
PRESETS = [
    {
        "name": "crane_sts_231ft_class",
        "kind": "sts",
        "rail_gauge": 30.48,          # 100 ft
        "width_between_legs": 18.30,  # 60 ft
        "portal_length": 27.13,       # 89 ft overall length along quay
        "height_under_beam": 17.07,   # 56 ft
        "boom_l_waterside": 70.40,    # ~231 ft
        "boom_l_landside": 24.00,
        "boom_angle": 14.0,
        "enabled": True,
    },
    {
        "name": "crane_sts_201ft_class",
        "kind": "sts",
        "rail_gauge": 30.48,
        "width_between_legs": 18.30,
        "portal_length": 27.13,
        "height_under_beam": 16.75,
        "boom_l_waterside": 61.30,    # ~201 ft
        "boom_l_landside": 22.00,
        "boom_angle": 12.0,
        "enabled": True,
    },
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


def purge_crane_objects():
    prefixes = ("crane_", "COLLIDER_crane_", "SNAP_")
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
        out = nodes.new(type="ShaderNodeOutputMaterial")
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
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
# STS builder
# ------------------------------------------------------------
def add_diagonal(parts: List[bpy.types.Object], prefix: str, p0: Tuple[float, float, float], p1: Tuple[float, float, float],
                 thickness: float, col: bpy.types.Collection):
    dx = p1[0] - p0[0]
    dy = p1[1] - p0[1]
    dz = p1[2] - p0[2]
    length = max(0.2, math.sqrt(dx * dx + dy * dy + dz * dz))

    # Orient as a rough YZ stick for truss look; enough for low-poly silhouette.
    ry = math.atan2(dx, max(1e-6, math.sqrt(dy * dy + dz * dz)))
    rx = -math.atan2(dz, max(1e-6, dy))

    mid = ((p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5, (p0[2] + p1[2]) * 0.5)
    brace = add_box_part(
        f"{prefix}__diag",
        (thickness, length, thickness),
        mid,
        col,
        rot=(rx, ry, 0.0),
    )
    parts.append(brace)


def build_sts_crane(name: str, rail_gauge: float, width_between_legs: float, portal_length: float,
                    height_under_beam: float, boom_l_waterside: float, boom_l_landside: float,
                    boom_angle: float, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []

    # Coordinate frame used here:
    # X = from landside to waterside (rail gauge / ship reach direction)
    # Y = along quay (leg-to-leg distance)
    # Z = up
    x_land = 0.0
    x_water = rail_gauge
    y_min = 0.0
    y_max = width_between_legs
    x_mid = (x_land + x_water) * 0.5
    y_mid = (y_min + y_max) * 0.5

    leg_w = 1.0
    leg_d = 1.1
    beam_h = 1.4
    top_z = height_under_beam + beam_h

    # 4 portal legs + bogies on rails
    for lx in (x_land, x_water):
        for ly in (y_min, y_max):
            leg = add_box_part(
                f"{name}__leg",
                (leg_w, leg_d, height_under_beam),
                (lx, ly, height_under_beam * 0.5),
                col,
            )
            parts.append(leg)
            bogie = add_box_part(
                f"{name}__bogie",
                (1.8, 1.1, 0.5),
                (lx, ly, 0.25),
                col,
            )
            parts.append(bogie)

    # Upper portal beams (one at each rail line), spanning leg spacing along quay.
    for lx in (x_land, x_water):
        beam = add_box_part(
            f"{name}__portal_beam",
            (0.9, width_between_legs, beam_h),
            (lx, y_mid, top_z - beam_h * 0.5),
            col,
        )
        parts.append(beam)

    # Girder across rail-gauge direction.
    bridge = add_box_part(
        f"{name}__bridge",
        (rail_gauge, 1.6, 1.0),
        (x_mid, y_mid, top_z + 1.1),
        col,
    )
    parts.append(bridge)

    # House on landside
    house = add_box_part(
        f"{name}__house",
        (8.5, 6.0, 3.0),
        (x_land + 4.8, y_mid, top_z + 2.6),
        col,
    )
    parts.append(house)

    # A-frame mast near waterside hinge
    mast_base_x = x_water - 1.2
    mast = add_box_part(
        f"{name}__a_mast",
        (1.6, 1.6, 11.0),
        (mast_base_x, y_mid, top_z + 5.5),
        col,
    )
    parts.append(mast)
    mast_head = (mast_base_x, y_mid, top_z + 11.0)

    # Boom root near waterside beam
    boom_root = (x_water + 1.0, y_mid, top_z + 1.0)
    b_angle = math.radians(boom_angle)

    # Waterside boom (long)
    ws_mid = (
        boom_root[0] + math.cos(b_angle) * (boom_l_waterside * 0.5),
        y_mid,
        boom_root[2] + math.sin(b_angle) * (boom_l_waterside * 0.5),
    )
    ws_boom = add_box_part(
        f"{name}__boom_waterside",
        (boom_l_waterside, 2.0, 1.2),
        ws_mid,
        col,
        rot=(0.0, -b_angle, 0.0),
    )
    parts.append(ws_boom)
    boom_tip = (
        boom_root[0] + math.cos(b_angle) * boom_l_waterside,
        y_mid,
        boom_root[2] + math.sin(b_angle) * boom_l_waterside,
    )

    # Landside boom (counter-jib)
    ls_angle = math.radians(12.0)
    ls_mid = (
        boom_root[0] - math.cos(ls_angle) * (boom_l_landside * 0.5),
        y_mid,
        boom_root[2] + math.sin(ls_angle) * (boom_l_landside * 0.5),
    )
    ls_boom = add_box_part(
        f"{name}__boom_landside",
        (boom_l_landside, 1.4, 1.0),
        ls_mid,
        col,
        rot=(0.0, ls_angle, 0.0),
    )
    parts.append(ls_boom)
    landside_tip = (
        boom_root[0] - math.cos(ls_angle) * boom_l_landside,
        y_mid,
        boom_root[2] + math.sin(ls_angle) * boom_l_landside,
    )

    # Structural supports
    add_diagonal(parts, name, mast_head, boom_root, 0.22, col)
    add_diagonal(parts, name, mast_head, boom_tip, 0.18, col)
    add_diagonal(parts, name, mast_head, landside_tip, 0.18, col)
    add_diagonal(parts, name, (x_water, y_min, top_z - 0.8), boom_root, 0.24, col)
    add_diagonal(parts, name, (x_water, y_max, top_z - 0.8), boom_root, 0.24, col)

    # Trolley + spreader on waterside boom
    trolley = add_box_part(
        f"{name}__trolley",
        (2.2, 1.8, 1.2),
        (
            boom_root[0] + math.cos(b_angle) * (boom_l_waterside * 0.45),
            y_mid,
            boom_root[2] + math.sin(b_angle) * (boom_l_waterside * 0.45),
        ),
        col,
    )
    parts.append(trolley)
    spreader = add_box_part(
        f"{name}__spreader",
        (3.0, 1.0, 0.5),
        (trolley.location.x, trolley.location.y, max(1.0, trolley.location.z - 22.0)),
        col,
    )
    parts.append(spreader)

    # Service platform
    service = add_box_part(
        f"{name}__service_platform",
        (2.0, 4.5, 0.25),
        (x_land + 4.2, y_mid, top_z + 0.8),
        col,
    )
    parts.append(service)

    obj = join_and_name(parts, name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Crane_STS_Blue", (0.18, 0.56, 0.64, 1.0), 0.5, 0.15))
    return obj


def add_snaps(base_name: str, lod0: bpy.types.Object, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(lod0)
    cx = (min_x + max_x) * 0.5
    cy = (min_y + max_y) * 0.5
    create_snap_empty(f"SNAP_START_{base_name}", (cx, min_y, min_z), lod0, col)
    create_snap_empty(f"SNAP_END_{base_name}", (cx, max_y, min_z), lod0, col)
    create_snap_empty(f"SNAP_TOP_{base_name}", (cx, cy, max_z), lod0, col)


def build_asset_with_lods(defn: dict, col: bpy.types.Collection):
    name = defn["name"]
    kind = defn["kind"]

    if kind != "sts":
        return

    lod0 = build_sts_crane(
        f"{name}_lod0",
        defn["rail_gauge"],
        defn["width_between_legs"],
        defn["portal_length"],
        defn["height_under_beam"],
        defn["boom_l_waterside"],
        defn["boom_l_landside"],
        defn["boom_angle"],
        col,
    )

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
    purge_crane_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    created = 0
    for defn in PRESETS:
        if not defn.get("enabled", True):
            continue
        build_asset_with_lods(defn, col)
        created += 1

    print(f"Created {created} crane assets in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
