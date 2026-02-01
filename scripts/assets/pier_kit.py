import bpy
import math

# ----------------------------
# Config / Conventions
# ----------------------------
COLLECTION_NAME = "PierKit"
FORWARD_AXIS = "+Y"  # along-the-line direction

# Naming: assetType_variant_size_lodX
ASSET_TYPE = "pier"

# Dimensions (meters)
STRAIGHT_LEN = 5.0
DECK_WIDTH = 3.0
DECK_THICKNESS = 0.10
SUPPORT_HEIGHT = 1.0
SUPPORT_SIZE = 0.30
SUPPORT_CENTER_X = 0.75  # center offset from deck center on X

STRINGER_COUNT = 3
STRINGER_SPACING = 0.60  # center-to-center spacing on X
STRINGER_WIDTH = 0.20
STRINGER_HEIGHT = 0.12


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


def purge_pier_objects():
    prefixes = (f"{ASSET_TYPE}_", "SNAP_")
    ensure_object_mode()
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


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
def get_or_create_wood_material(name: str = "Pier_Wood") -> bpy.types.Material:
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
        bsdf.inputs["Base Color"].default_value = (0.28, 0.22, 0.16, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = 0.75
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
# Builders (explicit coords; no recentering)
# ----------------------------
def build_slab_deck(name: str, length: float, width: float, bottom_z: float,
                    thickness: float, col: bpy.types.Collection) -> bpy.types.Object:
    deselect_all()
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    deck = bpy.context.active_object
    deck.name = f"{name}__deck"
    deck.scale = (width * 0.5, length * 0.5, thickness * 0.5)
    deck.location = (0.0, length * 0.5, bottom_z + (thickness * 0.5))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    force_into_collection(deck, col)
    return deck


def build_support_posts(name: str, length: float, height: float, size: float,
                        center_x: float, col: bpy.types.Collection):
    posts = []
    y = length * 0.5
    x = center_x - (size * 0.5)
    for sx in (-x, x):
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        p = bpy.context.active_object
        p.name = f"{name}__support"
        p.scale = (size * 0.5, size * 0.5, height * 0.5)
        p.location = (sx, y, height * 0.5)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        force_into_collection(p, col)
        posts.append(p)
    return posts


def build_stringers(name: str, length: float, top_z: float, count: int,
                    spacing: float, s_width: float, s_height: float,
                    col: bpy.types.Collection):
    stringers = []
    if count <= 1:
        xs = [0.0]
    else:
        start = -((count - 1) * spacing * 0.5)
        xs = [start + i * spacing for i in range(count)]
    for sx in xs:
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        s = bpy.context.active_object
        s.name = f"{name}__stringer"
        # Rotate 90° around Y so cross-section is flipped
        s.scale = (s_height * 0.5, length * 0.5, s_width * 0.5)
        s.location = (sx, length * 0.5, top_z - (s_height * 0.5))
        s.rotation_euler = (0.0, math.radians(90.0), 0.0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        force_into_collection(s, col)
        stringers.append(s)
    return stringers


def join_and_name(objs, name: str):
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


def build_pier_straight(name: str, length: float, width: float, support_height: float,
                        thickness: float, col: bpy.types.Collection) -> bpy.types.Object:
    deck_bottom_z = support_height
    deck = build_slab_deck(name, length, width, deck_bottom_z, thickness, col)

    posts = build_support_posts(name, length, support_height, SUPPORT_SIZE,
                                SUPPORT_CENTER_X, col)

    stringers = build_stringers(name, length, deck_bottom_z,
                                STRINGER_COUNT, STRINGER_SPACING,
                                STRINGER_WIDTH, STRINGER_HEIGHT, col)

    obj = join_and_name([deck] + posts + stringers, name)
    shade_smooth_with_autosmooth(obj, 40.0)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_wood_material())
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


# ----------------------------
# Main
# ----------------------------
def main():
    ensure_units_meters()
    purge_pier_objects()
    wipe_collection(COLLECTION_NAME)
    col = get_or_create_collection(COLLECTION_NAME)

    base_name = f"{ASSET_TYPE}_straight_{int(STRAIGHT_LEN)}m"
    lod0 = build_pier_straight(base_name, STRAIGHT_LEN, DECK_WIDTH,
                               SUPPORT_HEIGHT, DECK_THICKNESS, col)
    lod0.name = f"{base_name}_lod0"
    if lod0.data:
        lod0.data.name = lod0.name
    lod0["asset_name"] = base_name
    lod0["lod"] = 0

    create_snap_empty(f"SNAP_START_{base_name}", (0.0, 0.0, 0.0), lod0, col)
    create_snap_empty(f"SNAP_END_{base_name}", (0.0, STRAIGHT_LEN, 0.0), lod0, col)

    print(f"Created 1 pier asset in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
