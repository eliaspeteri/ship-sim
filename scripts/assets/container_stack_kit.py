import bpy
import math
from typing import Dict, List, Tuple

# ============================================================
# Container Stack Kit (Blender 5.0+)
# Conventions:
#   - Units: meters (1 BU = 1m)
#   - Z up
#   - Forward along +Y
#   - Pivot at start face center on ground plane: (0,0,0)
# ============================================================

COLLECTION_NAME = "ContainerStackKit"
ASSET_TYPE = "container_stack"
FORWARD_AXIS = "+Y"

CONTAINER_TYPES: Dict[str, Dict[str, float]] = {
    "20ft": {"length": 6.058, "width": 2.438, "height": 2.591},
    "40ft": {"length": 12.192, "width": 2.438, "height": 2.591},
}

FRAME_POST_W = 0.12

STACK_GAP_X = 0.20
STACK_GAP_Y = 0.25
# Vertical stack gap: half of length-wise frame post width.
STACK_GAP_Z = FRAME_POST_W

LOD_SETTINGS = {
    "lod0": {
        "rib_pitch": 0.28,
        "rib_depth": 0.03,
        "rib_height_margin": 0.16,
        "roof_ribs": True,
        "door_bars": True,
        "bevel": 0.015,
    },
    "lod1": {
        "rib_pitch": 0.45,
        "rib_depth": 0.02,
        "rib_height_margin": 0.20,
        "roof_ribs": True,
        "door_bars": True,
        "bevel": 0.01,
    },
    "lod2": {
        "rib_pitch": 0.0,
        "rib_depth": 0.0,
        "rib_height_margin": 0.0,
        "roof_ribs": False,
        "door_bars": False,
        "bevel": 0.0,
    },
}

# Presets are generated as blocks of identical containers.
# Grid axes:
#   x = across stack width
#   y = forward depth
#   z = stacked vertically
PRESETS = [
    {"name": "container20_single", "ctype": "20ft", "grid": (1, 1, 1), "enabled": True},
    {"name": "container40_single", "ctype": "40ft", "grid": (1, 1, 1), "enabled": True},
    {"name": "container20_stack_1x1x2", "ctype": "20ft", "grid": (1, 1, 2), "enabled": True},
    {"name": "container40_stack_1x1x2", "ctype": "40ft", "grid": (1, 1, 2), "enabled": True},
    {"name": "container20_stack_2x2x2", "ctype": "20ft", "grid": (2, 2, 2), "enabled": True},
    {"name": "container20_stack_1x2x2", "ctype": "20ft", "grid": (1, 2, 2), "enabled": True},
    {"name": "container40_stack_2x2x2", "ctype": "40ft", "grid": (2, 2, 2), "enabled": True},
    {"name": "container40_stack_1x2x2", "ctype": "40ft", "grid": (1, 2, 2), "enabled": True},
]

# Slight overlap to avoid coplanar boolean artifacts on outer faces.
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


def purge_container_stack_objects():
    prefixes = (
        "container",
        "COLLIDER_container",
        "SNAP_",
    )
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


def get_or_create_container_paint_material(name: str = "Container_Paint") -> bpy.types.Material:
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
        bsdf.inputs["Base Color"].default_value = (0.58, 0.22, 0.14, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.05
        bsdf.inputs["Roughness"].default_value = 0.6
        links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    return mat


def get_or_create_container_frame_material(name: str = "Container_Frame") -> bpy.types.Material:
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
        bsdf.inputs["Base Color"].default_value = (0.16, 0.17, 0.19, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.2
        bsdf.inputs["Roughness"].default_value = 0.55
        links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    return mat


def assign_material(obj: bpy.types.Object, mat: bpy.types.Material):
    if obj.type != "MESH" or mat is None:
        return
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat


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


def apply_bevel(obj: bpy.types.Object, width: float, segments: int = 2):
    if width <= 0.0:
        return
    bev = obj.modifiers.new(name="Bevel", type="BEVEL")
    bev.width = width
    bev.segments = segments
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(45.0)


def bounds_from_mesh(obj: bpy.types.Object) -> Tuple[float, float, float, float, float, float]:
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


def set_origin_to_start_face_center(obj: bpy.types.Object):
    # Recenter mesh so origin is at x-center, y-min, z-min.
    min_x, max_x, min_y, _max_y, min_z, _max_z = bounds_from_mesh(obj)
    cx = (min_x + max_x) * 0.5

    for v in obj.data.vertices:
        v.co.x -= cx
        v.co.y -= min_y
        v.co.z -= min_z

    obj.location = (0.0, 0.0, 0.0)


def add_box_part(name: str, dims: Tuple[float, float, float], location: Tuple[float, float, float], col: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    # size=1.0 cube has unit dimensions already, so scale directly by target dims.
    obj.scale = (dims[0], dims[1], dims[2])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    force_into_collection(obj, col)
    return obj


def add_cylinder_part(name: str, radius: float, depth: float, location: Tuple[float, float, float],
                      rotation: Tuple[float, float, float], col: bpy.types.Collection, vertices: int = 16) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    force_into_collection(obj, col)
    return obj


def apply_boolean_difference(target: bpy.types.Object, cutters: List[bpy.types.Object], join_name: str):
    if target.type != "MESH" or not cutters:
        return

    ensure_object_mode()
    deselect_all()
    # Keep a backup so a failed boolean pass cannot erase the container body.
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

    # If boolean produced invalid/empty output, restore the original body mesh.
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


def generate_grid_positions(dims: Dict[str, float], grid: Tuple[int, int, int]) -> List[Tuple[float, float, float]]:
    count_x, count_y, count_z = grid
    w = dims["width"]
    l = dims["length"]
    h = dims["height"]

    total_w = (count_x * w) + ((count_x - 1) * STACK_GAP_X)

    positions = []
    for iz in range(count_z):
        for iy in range(count_y):
            for ix in range(count_x):
                x = -0.5 * total_w + (w * 0.5) + ix * (w + STACK_GAP_X)
                y = iy * (l + STACK_GAP_Y)
                z = iz * (h + STACK_GAP_Z)
                positions.append((x, y, z))
    return positions


def build_single_container_parts(prefix: str, dims: Dict[str, float], base_pos: Tuple[float, float, float],
                                 lod_key: str, col: bpy.types.Collection, is_top_in_stack: bool) -> List[bpy.types.Object]:
    settings = LOD_SETTINGS[lod_key]
    w = dims["width"]
    l = dims["length"]
    h = dims["height"]

    x0, y0, z0 = base_pos
    parts: List[bpy.types.Object] = []

    # Main body
    body = add_box_part(
        f"{prefix}__body",
        (w, l, h),
        (x0, y0 + (l * 0.5), z0 + (h * 0.5)),
        col,
    )
    parts.append(body)

    # Corner castings/posts: overshoot above and below, and straddle side/end faces.
    post_w = FRAME_POST_W
    post_extra_z = 0.06
    for sx in (-1.0, 1.0):
        for sy in (0.0, l):
            px = x0 + sx * (w * 0.5)
            py = y0 + sy
            pz = z0 + (h * 0.5)
            post = add_box_part(
                f"{prefix}__corner",
                (post_w, post_w, h + (2.0 * post_extra_z)),
                (px, py, pz),
                col,
            )
            parts.append(post)

    # Horizontal rails on the 4 side edges (top/bottom x left/right),
    # shortened so they are flush to the corner posts without overlap.
    edge_len = max(0.01, l - post_w)
    for sx in (-1.0, 1.0):
        for sz in (0.0, h):
            edge_rail = add_box_part(
                f"{prefix}__edge_rail",
                (post_w, edge_len, post_w),
                (x0 + sx * (w * 0.5), y0 + (l * 0.5), z0 + sz),
                col,
            )
            parts.append(edge_rail)

    # End-face rails on both ends (y=0 and y=l), top and bottom, across width.
    end_rail_w = max(0.01, w - post_w)
    for sy in (0.0, l):
        for sz in (0.0, h):
            end_rail = add_box_part(
                f"{prefix}__end_rail",
                (end_rail_w, post_w, post_w),
                (x0, y0 + sy, z0 + sz),
                col,
            )
            parts.append(end_rail)

    # Corrugation recesses (boolean cutters) for side walls + roof.
    cutters: List[bpy.types.Object] = []
    rib_pitch = settings["rib_pitch"]
    rib_depth = settings["rib_depth"]
    rib_height_margin = settings["rib_height_margin"]
    if rib_pitch > 0.0 and rib_depth > 0.0:
        rib_count = max(1, int((l - 0.2) / rib_pitch))
        groove_w = min(rib_pitch * 0.45, 0.16)
        groove_h = max(0.3, h - rib_height_margin)
        groove_thickness = max(rib_depth * 1.2, 0.01)
        for i in range(rib_count):
            py = y0 + 0.1 + (i + 0.5) * ((l - 0.2) / rib_count)
            for sx in (-1.0, 1.0):
                px = x0 + sx * (w * 0.5 - groove_thickness * 0.5 + BOOLEAN_OVERLAP_EPS)
                rib = add_box_part(
                    f"{prefix}__groove_cut",
                    (groove_thickness, groove_w, groove_h),
                    (px, py, z0 + h * 0.5),
                    col,
                )
                cutters.append(rib)

        # Door-face recesses: exactly 2 columns x 3 horizontal bands.
        door_panel_centers = (-w * 0.25, w * 0.25)
        door_row_t = (0.27, 0.50, 0.73)
        door_band_h = 0.12 if lod_key == "lod0" else 0.14
        door_band_w = (w * 0.5) - (post_w * 0.75)
        for cx in door_panel_centers:
            for t in door_row_t:
                band = add_box_part(
                    f"{prefix}__door_band_cut",
                    (door_band_w, groove_thickness, door_band_h),
                    (x0 + cx, y0 + groove_thickness * 0.5 - BOOLEAN_OVERLAP_EPS, z0 + (h * t)),
                    col,
                )
                cutters.append(band)

        # Rear-end (+Y face) vertical corrugation recesses.
        rear_count = 5 if lod_key == "lod0" else 4
        rear_groove_w = min(rib_pitch * 0.8, 0.22)
        rear_groove_h = h - 0.24
        for i in range(rear_count):
            tx = (i + 1) / (rear_count + 1)
            gx = x0 - (w * 0.5) + (w * tx)
            rear_groove = add_box_part(
                f"{prefix}__rear_vert_groove_cut",
                (rear_groove_w, groove_thickness, rear_groove_h),
                (gx, y0 + l - groove_thickness * 0.5 + BOOLEAN_OVERLAP_EPS, z0 + h * 0.5),
                col,
            )
            cutters.append(rear_groove)

    # Roof corrugation only on topmost containers in a stack.
    if settings["roof_ribs"] and is_top_in_stack and rib_pitch > 0.0 and rib_depth > 0.0:
        roof_rib_count = max(2, int((l - 0.4) / (rib_pitch * 1.5)))
        roof_rib_w = min(rib_pitch * 0.6, 0.22)
        roof_depth = max(rib_depth * 1.2, 0.01)
        for i in range(roof_rib_count):
            py = y0 + 0.2 + (i + 0.5) * ((l - 0.4) / roof_rib_count)
            roof_rib = add_box_part(
                f"{prefix}__roof_groove_cut",
                (w - 0.2, roof_rib_w, roof_depth),
                (x0, py, z0 + h - roof_depth * 0.5 + BOOLEAN_OVERLAP_EPS),
                col,
            )
            cutters.append(roof_rib)

    apply_boolean_difference(body, cutters, f"{prefix}__corrugation_cutters")

    # End door bars on start face for close-range readability
    if settings["door_bars"]:
        bar_radius = 0.030 if lod_key == "lod0" else 0.034
        # Span clear opening between top and bottom frame posts.
        bar_h = max(0.1, h - (post_w))
        for sx in (-1.0, 1.0):
            px = x0 + sx * (w * 0.25)
            py = y0 - (bar_radius + 0.01)
            pz = z0 + (h * 0.5)
            bar = add_cylinder_part(
                f"{prefix}__door_bar",
                radius=bar_radius,
                depth=bar_h,
                location=(px, py, pz),
                rotation=(0.0, 0.0, 0.0),
                col=col,
                vertices=12,
            )
            parts.append(bar)

    return parts


def build_stack_asset_lod(asset_name: str, dims: Dict[str, float], grid: Tuple[int, int, int],
                          lod_key: str, col: bpy.types.Collection) -> bpy.types.Object:
    all_parts: List[bpy.types.Object] = []
    count_x, count_y, count_z = grid
    w = dims["width"]
    l = dims["length"]
    h = dims["height"]
    total_w = (count_x * w) + ((count_x - 1) * STACK_GAP_X)

    i = 0
    for iz in range(count_z):
        for iy in range(count_y):
            for ix in range(count_x):
                x = -0.5 * total_w + (w * 0.5) + ix * (w + STACK_GAP_X)
                y = iy * (l + STACK_GAP_Y)
                z = iz * (h + STACK_GAP_Z)
                prefix = f"{asset_name}_{lod_key}_c{i:02d}"
                container_parts = build_single_container_parts(
                    prefix,
                    dims,
                    (x, y, z),
                    lod_key,
                    col,
                    is_top_in_stack=(iz == count_z - 1),
                )
                all_parts.extend(container_parts)
                i += 1

    merged = join_and_name(all_parts, f"{asset_name}_{lod_key}")
    set_origin_to_start_face_center(merged)
    apply_bevel(merged, LOD_SETTINGS[lod_key]["bevel"], segments=2)

    bpy.context.view_layer.objects.active = merged
    merged.select_set(True)
    bpy.ops.object.convert(target="MESH")
    merged.select_set(False)

    shade_smooth_with_autosmooth(merged, 35.0)
    add_custom_props(merged, "visual" if lod_key == "lod0" else "visual_lod")

    # Painted body material for all LODs.
    assign_material(merged, get_or_create_container_paint_material())
    return merged


def create_collider_from_bounds(parent: bpy.types.Object, asset_name: str, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(parent)
    sx = max_x - min_x
    sy = max_y - min_y
    sz = max_z - min_z

    cx = (min_x + max_x) * 0.5
    cy = (min_y + max_y) * 0.5
    cz = (min_z + max_z) * 0.5

    collider = add_box_part(
        f"COLLIDER_{asset_name}",
        (sx, sy, sz),
        (cx, cy, cz),
        col,
    )

    add_custom_props(collider, "collision")
    collider.parent = parent
    collider.matrix_parent_inverse = parent.matrix_world.inverted()
    collider.display_type = "WIRE"
    collider.hide_render = True
    assign_material(collider, get_or_create_container_frame_material())
    return collider


def create_snap_empty(name: str, location: Tuple[float, float, float], parent: bpy.types.Object,
                      col: bpy.types.Collection):
    deselect_all()
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=location)
    snap = bpy.context.active_object
    snap.name = name
    add_custom_props(snap, "snap_point")
    snap.parent = parent
    snap.matrix_parent_inverse = parent.matrix_world.inverted()
    force_into_collection(snap, col)
    return snap


def create_stack_snaps(asset_name: str, root_obj: bpy.types.Object, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, _min_z, max_z = bounds_from_mesh(root_obj)
    cx = (min_x + max_x) * 0.5

    create_snap_empty(f"SNAP_START_{asset_name}", (cx, min_y, 0.0), root_obj, col)
    create_snap_empty(f"SNAP_END_{asset_name}", (cx, max_y, 0.0), root_obj, col)
    create_snap_empty(f"SNAP_TOP_{asset_name}", (cx, min_y, max_z), root_obj, col)


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------
def main():
    ensure_units_meters()
    purge_container_stack_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    created = 0

    for preset in PRESETS:
        if not preset.get("enabled", True):
            continue

        asset_name = preset["name"]
        dims = CONTAINER_TYPES[preset["ctype"]]
        grid = preset["grid"]

        lod0 = build_stack_asset_lod(asset_name, dims, grid, "lod0", col)
        lod0["asset_name"] = asset_name
        lod0["lod"] = 0
        lod0["container_type"] = preset["ctype"]

        lod1 = build_stack_asset_lod(asset_name, dims, grid, "lod1", col)
        lod1["asset_name"] = asset_name
        lod1["lod"] = 1
        lod1["container_type"] = preset["ctype"]

        lod2 = build_stack_asset_lod(asset_name, dims, grid, "lod2", col)
        lod2["asset_name"] = asset_name
        lod2["lod"] = 2
        lod2["container_type"] = preset["ctype"]

        lod1.parent = lod0
        lod1.matrix_parent_inverse = lod0.matrix_world.inverted()
        lod2.parent = lod0
        lod2.matrix_parent_inverse = lod0.matrix_world.inverted()

        create_collider_from_bounds(lod0, asset_name, col)
        create_stack_snaps(asset_name, lod0, col)

        created += 1

    print(f"Created {created} container stack presets in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
