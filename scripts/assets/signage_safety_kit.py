import bpy
import math
from typing import List, Tuple

# ============================================================
# Signage & Safety Kit (Blender 5.0+)
# Conventions:
#   - Units: meters (1 BU = 1m)
#   - Z up
#   - Forward along +Y
#   - Pivot at start face center on ground plane: (0,0,0)
# ============================================================

COLLECTION_NAME = "SignageSafetyKit"
FORWARD_AXIS = "+Y"
ASSET_TYPE = "safety"

LOD_RATIOS = [
    ("lod1", 0.55),
    ("lod2", 0.25),
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


def purge_objects():
    prefixes = ("safety_", "COLLIDER_safety_", "SNAP_")
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


def add_box_part(name: str, dims: Tuple[float, float, float], location: Tuple[float, float, float], col: bpy.types.Collection):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dims
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


def create_collider_from_bounds(parent: bpy.types.Object, name: str, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(parent)
    sx = max_x - min_x
    sy = max_y - min_y
    sz = max_z - min_z
    cx = (min_x + max_x) * 0.5
    cy = (min_y + max_y) * 0.5
    cz = (min_z + max_z) * 0.5

    collider = add_box_part(f"COLLIDER_{name}", (sx, sy, sz), (cx, cy, cz), col)
    add_custom_props(collider, "collision")
    collider.parent = parent
    collider.matrix_parent_inverse = parent.matrix_world.inverted()
    collider.display_type = "WIRE"
    collider.hide_render = True
    return collider


def duplicate_with_decimate(src: bpy.types.Object, new_name: str, ratio: float, col: bpy.types.Collection) -> bpy.types.Object:
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
def build_warning_sign(name: str, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []

    # post
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.03, depth=2.2, location=(0.0, 0.0, 1.1))
    post = bpy.context.active_object
    post.name = f"{name}__post"
    force_into_collection(post, col)
    parts.append(post)

    # triangular panel (cube + rotate to look like warning board silhouette)
    panel = add_box_part(f"{name}__panel", (0.46, 0.03, 0.40), (0.0, 0.0, 1.75), col)
    parts.append(panel)

    obj = join_and_name(parts, name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Safety_Yellow", (0.92, 0.76, 0.08, 1.0), 0.5, 0.0))
    return obj


def build_speed_board(name: str, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.025, depth=2.4, location=(0.0, 0.0, 1.2))
    post = bpy.context.active_object
    post.name = f"{name}__post"
    force_into_collection(post, col)
    parts.append(post)

    board = add_box_part(f"{name}__board", (0.55, 0.03, 0.55), (0.0, 0.0, 1.95), col)
    parts.append(board)

    obj = join_and_name(parts, name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Safety_White", (0.95, 0.95, 0.95, 1.0), 0.45, 0.0))
    return obj


def build_barrier_post(name: str, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.06, depth=1.2, location=(0.0, 0.0, 0.6))
    body = bpy.context.active_object
    body.name = f"{name}__body"
    force_into_collection(body, col)
    parts.append(body)

    cap = add_box_part(f"{name}__cap", (0.16, 0.16, 0.08), (0.0, 0.0, 1.16), col)
    parts.append(cap)

    obj = join_and_name(parts, name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Safety_Red", (0.78, 0.10, 0.09, 1.0), 0.52, 0.0))
    return obj


def build_cone(name: str, col: bpy.types.Collection) -> bpy.types.Object:
    parts = []

    base = add_box_part(f"{name}__base", (0.34, 0.34, 0.05), (0.0, 0.0, 0.025), col)
    parts.append(base)

    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.14, radius2=0.02, depth=0.45, location=(0.0, 0.0, 0.275))
    cone = bpy.context.active_object
    cone.name = f"{name}__cone"
    force_into_collection(cone, col)
    parts.append(cone)

    stripe = add_box_part(f"{name}__stripe", (0.20, 0.20, 0.06), (0.0, 0.0, 0.28), col)
    parts.append(stripe)

    obj = join_and_name(parts, name)
    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_material("Safety_Orange", (0.95, 0.36, 0.07, 1.0), 0.55, 0.0))
    return obj


def add_snaps_for_asset(asset_name: str, obj: bpy.types.Object, col: bpy.types.Collection):
    min_x, max_x, min_y, max_y, min_z, max_z = bounds_from_mesh(obj)
    cx = (min_x + max_x) * 0.5
    create_snap_empty(f"SNAP_START_{asset_name}", (cx, min_y, min_z), obj, col)
    create_snap_empty(f"SNAP_END_{asset_name}", (cx, max_y, min_z), obj, col)
    create_snap_empty(f"SNAP_TOP_{asset_name}", (cx, min_y, max_z), obj, col)


def build_asset_with_lods(base_name: str, lod0_builder, col: bpy.types.Collection):
    lod0 = lod0_builder(f"{base_name}_lod0", col)
    lod0["asset_name"] = base_name
    lod0["lod"] = 0

    for lod_name, ratio in LOD_RATIOS:
        lod = duplicate_with_decimate(lod0, f"{base_name}_{lod_name}", ratio, col)
        lod["asset_name"] = base_name
        lod["lod"] = int(lod_name[-1])
        lod.parent = lod0
        lod.matrix_parent_inverse = lod0.matrix_world.inverted()

    create_collider_from_bounds(lod0, base_name, col)
    add_snaps_for_asset(base_name, lod0, col)


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------
def main():
    ensure_units_meters()
    purge_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    build_asset_with_lods("safety_warning_sign", build_warning_sign, col)
    build_asset_with_lods("safety_speed_board", build_speed_board, col)
    build_asset_with_lods("safety_barrier_post", build_barrier_post, col)
    build_asset_with_lods("safety_cone", build_cone, col)

    print(f"Created signage/safety kit assets in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
