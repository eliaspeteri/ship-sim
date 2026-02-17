import bpy
import math

# ----------------------------
# Config / Conventions
# ----------------------------
COLLECTION_NAME = "QuayWallKit"
FORWARD_AXIS = "+Y"  # along-the-line direction

# Naming: assetType_variant_size_lodX
ASSET_TYPE = "quayWall"

# Dimensions (meters)
STRAIGHT_LEN = 5.0
WALL_HEIGHT = 4.0
WALL_THICKNESS = 2.0
COPING_HEIGHT = 0.25
COPING_OVERHANG = 0.15

# LOD decimation ratios
LOD_RATIOS = [
    ("lod1", 0.5),
    ("lod2", 0.2),
]

# Cylinder segment counts (only used for non-box bits, if any)
SEGMENTS_LOD0 = 24


# ----------------------------
# Helpers
# ----------------------------
def ensure_object_mode():
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')


def ensure_units_meters():
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0  # 1 BU = 1 meter


def get_or_create_collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def deselect_all():
    for obj in bpy.context.selected_objects:
        obj.select_set(False)


def force_into_collection(obj: bpy.types.Object, col: bpy.types.Collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def wipe_collection(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return
    objs = list(col.objects)
    if objs:
        ensure_object_mode()
        deselect_all()
        for o in objs:
            o.select_set(True)
        bpy.ops.object.delete()
        for o in objs:
            if o and o.users == 0:
                bpy.data.objects.remove(o, do_unlink=True)
    for scene in bpy.data.scenes:
        if col.name in scene.collection.children.keys():
            scene.collection.children.unlink(col)
    for parent_col in bpy.data.collections:
        if col.name in parent_col.children.keys():
            parent_col.children.unlink(col)
    bpy.data.collections.remove(col)


def purge_quay_objects():
    prefixes = (f"{ASSET_TYPE}_", "SNAP_")
    ensure_object_mode()
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def set_origin_start_face_ground(obj: bpy.types.Object):
    """
    Pivot rule for linear segments:
    - start face center on ground plane (z=0)
    - start face at y=0
    - centered in X
    """
    if obj.type != 'MESH':
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    # Move mesh so min Y -> 0, min Z -> 0, and center X -> 0
    min_y = min(v.co.y for v in obj.data.vertices)
    min_z = min(v.co.z for v in obj.data.vertices)
    xs = [v.co.x for v in obj.data.vertices]
    cx = (min(xs) + max(xs)) * 0.5
    for v in obj.data.vertices:
        v.co.y -= min_y
        v.co.z -= min_z
        v.co.x -= cx

    obj.location = (0.0, 0.0, 0.0)
    obj.select_set(False)


def add_custom_props(obj: bpy.types.Object, asset_role: str):
    obj["asset_role"] = asset_role
    obj["units"] = "meters"
    obj["forward_axis"] = FORWARD_AXIS


def shade_smooth_with_autosmooth(obj: bpy.types.Object, angle_deg: float = 35.0):
    if obj.type != 'MESH':
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.shade_auto_smooth(use_auto_smooth=True, angle=math.radians(angle_deg))
    obj.select_set(False)


# ----------------------------
# Materials
# ----------------------------
def get_or_create_concrete_material(name: str = "Quay_DarkConcrete") -> bpy.types.Material:
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
        bsdf.inputs["Base Color"].default_value = (0.12, 0.12, 0.12, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = 0.85
        links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat


def assign_material(obj: bpy.types.Object, mat: bpy.types.Material):
    if obj.type != 'MESH' or mat is None:
        return
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat


# ----------------------------
# Builders
# ----------------------------
def build_wall_block(name: str, length: float, height: float, thickness: float,
                     coping_h: float, coping_overhang: float,
                     col: bpy.types.Collection) -> bpy.types.Object:
    deselect_all()

    # Main wall block
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    wall = bpy.context.active_object
    wall.name = f"{name}__wall"
    wall.scale = (thickness * 0.5, length * 0.5, height * 0.5)
    wall.location = (0.0, 0.0, height * 0.5)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    force_into_collection(wall, col)

    # Deck/coping slab (slight overhang)
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    coping = bpy.context.active_object
    coping.name = f"{name}__coping"
    coping.scale = ((thickness + coping_overhang * 2.0) * 0.5,
                    length * 0.5,
                    coping_h * 0.5)
    coping.location = (0.0, 0.0, height + (coping_h * 0.15))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    force_into_collection(coping, col)

    ensure_object_mode()
    deselect_all()
    for o in (wall, coping):
        o.select_set(True)
    bpy.context.view_layer.objects.active = wall
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    if obj.data:
        obj.data.name = name

    set_origin_start_face_ground(obj)
    shade_smooth_with_autosmooth(obj, 40.0)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_concrete_material())
    return obj


def create_snap_empty(name: str, location: tuple, parent: bpy.types.Object, col: bpy.types.Collection):
    deselect_all()
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=location)
    e = bpy.context.active_object
    e.name = name
    add_custom_props(e, "snap_point")
    e.parent = parent
    e.matrix_parent_inverse = parent.matrix_world.inverted()
    force_into_collection(e, col)
    return e


def duplicate_with_decimate(src: bpy.types.Object, new_name: str, ratio: float, col: bpy.types.Collection) -> bpy.types.Object:
    deselect_all()
    dup = src.copy()
    dup.data = src.data.copy()
    dup.name = new_name
    bpy.context.collection.objects.link(dup)
    force_into_collection(dup, col)

    dec = dup.modifiers.new(name="Decimate", type='DECIMATE')
    dec.ratio = ratio

    bpy.context.view_layer.objects.active = dup
    dup.select_set(True)
    bpy.ops.object.convert(target='MESH')  # applies modifiers
    dup.select_set(False)

    add_custom_props(dup, "visual_lod")
    assign_material(dup, get_or_create_concrete_material())
    return dup


# ----------------------------
# Main
# ----------------------------
def main():
    ensure_units_meters()
    purge_quay_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    assets = []

    # Straight segment
    base_name = f"{ASSET_TYPE}_straight_{int(STRAIGHT_LEN)}m"
    lod0 = build_wall_block(base_name, STRAIGHT_LEN, WALL_HEIGHT, WALL_THICKNESS,
                            COPING_HEIGHT, COPING_OVERHANG, col)
    lod0.name = f"{base_name}_lod0"
    if lod0.data:
        lod0.data.name = lod0.name
    lod0["asset_name"] = base_name
    lod0["lod"] = 0
    create_snap_empty(f"SNAP_START_{base_name}", (0.0, 0.0, 0.0), lod0, col)
    create_snap_empty(f"SNAP_END_{base_name}", (0.0, STRAIGHT_LEN, 0.0), lod0, col)
    assets.append((base_name, lod0))

    # LODs
    for base_name, root in assets:
        for lod_name, ratio in LOD_RATIOS:
            lod = duplicate_with_decimate(root, f"{base_name}_{lod_name}", ratio, col)
            lod["asset_name"] = base_name
            lod["lod"] = int(lod_name[-1])
            lod.location = (0.0, 0.0, 0.0)
            lod.parent = root
            lod.matrix_parent_inverse = root.matrix_world.inverted()

    print(f"Created {len(assets)} quay wall assets in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
