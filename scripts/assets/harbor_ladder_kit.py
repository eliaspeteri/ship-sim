import bpy
import math

# ============================
# Harbor Ladder Kit (Blender 5.0+)
# Pivot/origin: TOP HOOK contact point at (0,0,0)
# Ladder extends downward along -Z
# ============================

COLLECTION_NAME = "HarborClutter_Ladder"
ASSET_BASE = "harbor_ladder_3m"

# Dimensions (meters)
HEIGHT = 3.0
WIDTH = 0.45
RAIL_THICK = 0.05
RAIL_DEPTH = 0.04  # along Y
RUNG_DIAM = 0.022
RUNG_DEPTH = 0.06  # protrusion along Y
HOOK_DEPTH = 0.12
HOOK_DROP = 0.10  # how far the hook wraps down (in -Z)

# Rung spacing per LOD
LOD_RUNG_SPACING = {
    0: 0.30,
    1: 0.45,
}

# Cylinder segments per LOD
LOD_RUNG_SEGMENTS = {
    0: 14,
    1: 10,
}

# LOD2: a single slab representation
LOD2_THICKNESS = 0.02

# Collider margin
COLLIDER_MARGIN_X = 0.03
COLLIDER_MARGIN_Y = 0.04
COLLIDER_MARGIN_Z = 0.03


# ----------------------------
# Helpers
# ----------------------------
def bake_location_into_mesh(obj: bpy.types.Object):
    """
    Makes the object's origin effectively move to world origin by:
    - adding obj.location to every vertex
    - setting obj.location to (0,0,0)
    Keeps the mesh in the same world-space position as before.
    """
    if obj.type != "MESH":
        obj.location = (0.0, 0.0, 0.0)
        return

    dx, dy, dz = obj.location.x, obj.location.y, obj.location.z
    if abs(dx) < 1e-9 and abs(dy) < 1e-9 and abs(dz) < 1e-9:
        return

    for v in obj.data.vertices:
        v.co.x += dx
        v.co.y += dy
        v.co.z += dz

    obj.location = (0.0, 0.0, 0.0)

def ensure_units_meters():
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0  # 1 BU = 1 meter

def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

def deselect_all():
    for o in bpy.context.selected_objects:
        o.select_set(False)

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

    # Unlink from parent collections
    for parent_col in bpy.data.collections:
        if col.name in parent_col.children.keys():
            parent_col.children.unlink(col)

    # Unlink from scene root if present
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

def add_custom_props(obj, role: str):
    obj["asset_role"] = role
    obj["units"] = "meters"
    obj["forward_axis"] = "+Y"

def shade_smooth_auto(obj, angle_deg=35.0):
    if obj.type != "MESH":
        return
    ensure_object_mode()
    deselect_all()
    obj.select_set(True)
    set_active(obj)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.shade_auto_smooth(use_auto_smooth=True, angle=math.radians(angle_deg))
    obj.select_set(False)

def apply_all_transforms(obj):
    ensure_object_mode()
    deselect_all()
    obj.select_set(True)
    set_active(obj)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)

def join_objects(objs, active_obj):
    ensure_object_mode()
    deselect_all()
    for o in objs:
        o.select_set(True)
    set_active(active_obj)
    bpy.ops.object.join()
    return bpy.context.active_object

def create_empty(name: str, loc, col):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = 'PLAIN_AXES'
    e.empty_display_size = 0.35
    e.location = loc
    link_only_to_collection(e, col)
    add_custom_props(e, "snap_point")
    return e


# ----------------------------
# Ladder construction
# ----------------------------
def make_rail(x_center: float, y_center: float, z_top: float, height: float, col):
    """
    Rail is a rectangular prism extending downward along -Z.
    Top is near z_top, bottom at z_top - height.
    """
    # Create cube and scale to rail dimensions
    bpy.ops.mesh.primitive_cube_add(location=(x_center, y_center, z_top - height * 0.5))
    o = bpy.context.active_object
    o.scale = (RAIL_THICK * 0.5, RAIL_DEPTH * 0.5, height * 0.5)
    apply_all_transforms(o)
    link_only_to_collection(o, col)
    return o

def make_hook(x_center: float, col):
    """
    A simple "hook lip" that protrudes forward (+Y) and wraps down a bit.
    Built as two boxes.
    """
    parts = []

    # Top lip (sits at origin height z=0)
    bpy.ops.mesh.primitive_cube_add(location=(x_center, RAIL_DEPTH * 0.5 + HOOK_DEPTH * 0.5, -RAIL_THICK * 0.5))
    lip = bpy.context.active_object
    lip.scale = (RAIL_THICK * 0.55, HOOK_DEPTH * 0.5, RAIL_THICK * 0.5)
    apply_all_transforms(lip)
    parts.append(lip)

    # Down wrap
    bpy.ops.mesh.primitive_cube_add(location=(x_center, RAIL_DEPTH * 0.5 + HOOK_DEPTH - (RAIL_THICK * 0.35), -HOOK_DROP * 0.5))
    wrap = bpy.context.active_object
    wrap.scale = (RAIL_THICK * 0.45, RAIL_THICK * 0.45, HOOK_DROP * 0.5)
    apply_all_transforms(wrap)
    parts.append(wrap)

    for p in parts:
        link_only_to_collection(p, col)

    return parts

def make_rung(z: float, segments: int, col):
    """
    Rung is a cylinder spanning width (X direction), located at given Z (negative).
    """
    # Cylinder default axis is Z; rotate to align along X
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=segments,
        radius=RUNG_DIAM * 0.5,
        depth=WIDTH - (RAIL_THICK * 1.2),
        location=(0.0, RAIL_DEPTH * 0.35 + RUNG_DEPTH * 0.5, z),
        rotation=(0.0, math.radians(90.0), 0.0)
    )
    r = bpy.context.active_object
    link_only_to_collection(r, col)
    return r

def build_ladder_lod(lod: int, col):
    name = f"{ASSET_BASE}_lod{lod}"

    if lod == 2:
        # Simple slab: just a thin box indicating ladder presence
        bpy.ops.mesh.primitive_cube_add(location=(0.0, RAIL_DEPTH * 0.5, -HEIGHT * 0.5))
        slab = bpy.context.active_object
        slab.scale = (WIDTH * 0.5, LOD2_THICKNESS * 0.5, HEIGHT * 0.5)
        apply_all_transforms(slab)
        link_only_to_collection(slab, col)
        slab.name = name
        add_custom_props(slab, "visual_lod")
        slab["lod"] = lod
        shade_smooth_auto(slab, 25.0)
        bake_location_into_mesh(slab)
                
        return slab

    # Rails
    x_left = -WIDTH * 0.5 + (RAIL_THICK * 0.5)
    x_right = WIDTH * 0.5 - (RAIL_THICK * 0.5)

    rail_l = make_rail(x_left, 0.0, 0.0, HEIGHT, col)
    rail_r = make_rail(x_right, 0.0, 0.0, HEIGHT, col)

    # Hooks
    hook_parts = []
    hook_parts += make_hook(x_left, col)
    hook_parts += make_hook(x_right, col)

    # Rungs
    spacing = LOD_RUNG_SPACING[lod]
    segments = LOD_RUNG_SEGMENTS[lod]

    # Start a bit below the hook
    z_start = -0.30
    z_end = -HEIGHT + 0.25
    rungs = []
    z = z_start
    while z >= z_end:
        rungs.append(make_rung(z, segments, col))
        z -= spacing

    # Join everything into one mesh for this LOD
    parts = [rail_l, rail_r] + hook_parts + rungs
    merged = join_objects(parts, active_obj=rail_l)
    merged.name = name
    bake_location_into_mesh(merged)
            
    add_custom_props(merged, "visual_lod")
    merged["lod"] = lod

    # Slight bevel for nicer highlights (LOD0 only)
    if lod == 0:
        bev = merged.modifiers.new(name="Bevel", type='BEVEL')
        bev.width = 0.008
        bev.segments = 2
        bev.limit_method = 'ANGLE'
        bev.angle_limit = math.radians(45.0)

        wn = merged.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')
        wn.keep_sharp = True

        # Apply modifiers for export
        deselect_all()
        merged.select_set(True)
        set_active(merged)
        bpy.ops.object.convert(target='MESH')
        merged.select_set(False)

    shade_smooth_auto(merged, 35.0)
    return merged


def create_collider(parent: bpy.types.Object, col):
    # Use known dims (slightly padded)
    w = WIDTH + 2 * COLLIDER_MARGIN_X
    d = (RAIL_DEPTH + HOOK_DEPTH + RUNG_DEPTH) + 2 * COLLIDER_MARGIN_Y
    h = HEIGHT + 2 * COLLIDER_MARGIN_Z

    # Center of ladder volume is at z = -HEIGHT/2
    bpy.ops.mesh.primitive_cube_add(location=(0.0, d * 0.5 * 0.15, -HEIGHT * 0.5))
    c = bpy.context.active_object
    c.scale = (w * 0.5, d * 0.5, h * 0.5)
    apply_all_transforms(c)

    c.name = f"COLLIDER_{ASSET_BASE}"
    c.display_type = 'WIRE'
    c.hide_render = True
    link_only_to_collection(c, col)
    add_custom_props(c, "collision")

    c.parent = parent
    c.matrix_parent_inverse = parent.matrix_world.inverted()
    return c


# ----------------------------
# Main
# ----------------------------
def main():
    ensure_units_meters()

    # Idempotent
    wipe_collection(COLLECTION_NAME)
    col = create_collection(COLLECTION_NAME)

    # Build LODs
    lod0 = build_ladder_lod(0, col)
    lod1 = build_ladder_lod(1, col)
    lod2 = build_ladder_lod(2, col)

    # Parent under LOD0 for organization
    lod1.parent = lod0
    lod2.parent = lod0

    # Collider + snap points
    create_collider(lod0, col)

    snap_hook = create_empty(f"SNAP_HOOK_{ASSET_BASE}", (0.0, 0.0, 0.0), col)
    snap_bottom = create_empty(f"SNAP_BOTTOM_{ASSET_BASE}", (0.0, 0.0, -HEIGHT), col)

    snap_hook.parent = lod0
    snap_bottom.parent = lod0

    print(f"Created ladder kit '{ASSET_BASE}' in collection '{COLLECTION_NAME}'.")

if __name__ == "__main__":
    main()
