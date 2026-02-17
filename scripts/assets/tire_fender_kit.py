import bpy
import math

# ============================
# Harbor Tire Fender Kit (Blender 5.0+)
# Pivot/origin: ROPE HOOK point at (0,0,0)
# Fender hangs downward along -Z
# ============================

COLLECTION_NAME = "HarborClutter_TireFenders"

# Tire dimensions (meters)
TIRE_OUTER_D = 1.10
TIRE_INNER_D = 0.55
TIRE_THICK   = 0.35  # thickness along Y

# Rope dimensions (meters)
ROPE_RADIUS = 0.018
ROPE_SPAN_X = 0.78   # distance between rope drops (approx outer - margin)
ROPE_DROP_Z = 1.35   # how far rope hangs
ROPE_FORWARD_Y = 0.18  # how far rope sits forward of origin in +Y (so it clears wall)

# Placement / layout
HOOK_TO_TIRE_TOP = 0.55  # distance from hook point (origin) down to top of tire
DOUBLE_GAP_Z = 0.10      # vertical gap between tires in the double variant

# LOD geometry
LOD_TORUS_MAJOR_SEG = {0: 48, 1: 28, 2: 16}
LOD_TORUS_MINOR_SEG = {0: 18, 1: 12, 2: 8}
LOD_ROPE_SEGMENTS   = {0: 16, 1: 12, 2: 8}

# LOD2 simplification: represent tire as a simple low-poly cylinder "ringish"
LOD2_USE_TORUS = False  # if False, LOD2 uses a cylinder shell approximation

# Collider margins
COLLIDER_MARGIN = 0.06

MAT_TIRE = None
MAT_ROPE = None



# ----------------------------
# Helpers
# ----------------------------
def get_or_create_mat(name: str, base_color, roughness=0.8, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat

def init_materials():
    global MAT_TIRE, MAT_ROPE
    MAT_TIRE = get_or_create_mat("MAT_TireRubber", base_color=(0.02, 0.02, 0.02), roughness=0.92, metallic=0.0)
    MAT_ROPE = get_or_create_mat("MAT_Rope", base_color=(0.18, 0.12, 0.06), roughness=0.85, metallic=0.0)

def assign_mat(obj, mat):
    if obj.type != "MESH":
        return
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat

def ensure_units_meters():
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0

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

def link_only_to_collection(obj, col):
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

def bake_location_into_mesh(obj):
    """
    If obj.location != (0,0,0), shift vertices by that location and zero it.
    Ensures origin is at world origin.
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

def create_empty(name: str, loc, col):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = 'PLAIN_AXES'
    e.empty_display_size = 0.40
    e.location = loc
    link_only_to_collection(e, col)
    add_custom_props(e, "snap_point")
    return e


# ----------------------------
# Geometry builders
# ----------------------------
def make_tire_torus(lod: int, center, col):
    major_r = TIRE_OUTER_D * 0.5 - (TIRE_OUTER_D - TIRE_INNER_D) * 0.25
    minor_r = (TIRE_OUTER_D - TIRE_INNER_D) * 0.25  # approx "tube" radius

    bpy.ops.mesh.primitive_torus_add(
        major_segments=LOD_TORUS_MAJOR_SEG[lod],
        minor_segments=LOD_TORUS_MINOR_SEG[lod],
        major_radius=major_r,
        minor_radius=minor_r,
        location=center,
        rotation=(math.radians(90), 0.0, 0.0)  # rotate so "hole axis" is Y; thickness along Y
    )
    t = bpy.context.active_object
    link_only_to_collection(t, col)

    assign_mat(t, MAT_TIRE)

    # Scale thickness along Y to match TIRE_THICK
    # Default torus tube is symmetric; we squash along Y a bit by scaling Y
    # because we want a thicker tire depth. Better: scale after creation.
    target = TIRE_THICK
    # Roughly, torus "depth" depends on minor radius; we simply scale Y until bbox matches.
    # We'll do a simple scale guess:
    t.scale.y = max(0.3, target / (minor_r * 2.0))
    apply_all_transforms(t)
    return t

def make_tire_lod2_shell(center, col):
    """
    Cheap LOD2 approximation: a short cylinder shell that reads as a tire.
    """
    outer_r = TIRE_OUTER_D * 0.5
    inner_r = TIRE_INNER_D * 0.5

    # Outer cylinder
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=18, radius=outer_r, depth=TIRE_THICK,
        location=center, rotation=(math.radians(90), 0.0, 0.0)
    )
    outer = bpy.context.active_object
    link_only_to_collection(outer, col)

    # Inner cylinder (to be subtracted) — easiest is to just scale down and keep as visual hint
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=18, radius=inner_r, depth=TIRE_THICK * 1.02,
        location=center, rotation=(math.radians(90), 0.0, 0.0)
    )
    inner = bpy.context.active_object
    link_only_to_collection(inner, col)

    # Boolean difference
    mod = outer.modifiers.new(name="BoolInner", type='BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = inner

    deselect_all()
    outer.select_set(True)
    set_active(outer)
    bpy.ops.object.convert(target='MESH')
    outer.select_set(False)

    # delete cutter
    deselect_all()
    inner.select_set(True)
    bpy.ops.object.delete()

    assign_mat(outer, MAT_TIRE)

    return outer

def make_rope_u_loop(lod: int, left_pt, right_pt, sag: float, col):
    """
    Creates a 3-point curve (left -> sagged middle -> right), bevelled into a rope,
    then converts to mesh for joining.
    """
    import mathutils

    p0 = mathutils.Vector(left_pt)
    p2 = mathutils.Vector(right_pt)
    mid = (p0 + p2) * 0.5
    p1 = mathutils.Vector((mid.x, mid.y, mid.z - sag))

    # Create curve data
    curve = bpy.data.curves.new("RopeLoopCurve", type='CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 2

    spline = curve.splines.new(type='BEZIER')
    spline.bezier_points.add(2)  # total 3 points

    spline.bezier_points[0].co = p0
    spline.bezier_points[1].co = p1
    spline.bezier_points[2].co = p2

    for bp in spline.bezier_points:
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    # Rope thickness via bevel
    curve.bevel_depth = ROPE_RADIUS
    curve.bevel_resolution = 2 if lod == 0 else (1 if lod == 1 else 0)

    obj = bpy.data.objects.new("RopeLoop", curve)
    link_only_to_collection(obj, col)

    # Convert to mesh so it joins cleanly
    ensure_object_mode()
    deselect_all()
    obj.select_set(True)
    set_active(obj)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)

    assign_mat(obj, MAT_ROPE)
    return obj


def make_rope_segment(lod: int, p0, p1, col):
    """
    Creates a rope cylinder from p0 to p1.
    """
    import mathutils
    v0 = mathutils.Vector(p0)
    v1 = mathutils.Vector(p1)
    d = v1 - v0
    length = d.length
    if length < 1e-6:
        return None

    mid = (v0 + v1) * 0.5
    # Cylinder aligned along Z by default; rotate to align with d
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=LOD_ROPE_SEGMENTS[lod],
        radius=ROPE_RADIUS,
        depth=length,
        location=mid
    )
    c = bpy.context.active_object
    link_only_to_collection(c, col)

    assign_mat(c, MAT_ROPE)

    # Align cylinder local Z to direction d
    z_axis = mathutils.Vector((0, 0, 1))
    rot = z_axis.rotation_difference(d.normalized())
    c.rotation_mode = 'QUATERNION'
    c.rotation_quaternion = rot
    apply_all_transforms(c)
    return c


# ----------------------------
# Fender builders
# ----------------------------
def build_fender(name_base: str, lod: int, variant: str, col):
    """
    variant: "single" | "double"
    """
    parts = []

    # Hook point at origin. We'll place ropes first.
    # Two rope drops at +/- rope_span/2
    x0 = -ROPE_SPAN_X * 0.5
    x1 =  ROPE_SPAN_X * 0.5

    # Rope top points (hook)
    top0 = (x0, ROPE_FORWARD_Y, 0.0)
    top1 = (x1, ROPE_FORWARD_Y, 0.0)

    # Rope bottom points (near top of tire)
    tire1_center_z = -(HOOK_TO_TIRE_TOP + TIRE_OUTER_D * 0.5)
    rope_bottom_z = -(HOOK_TO_TIRE_TOP)
    bot0 = (x0, ROPE_FORWARD_Y, rope_bottom_z)
    bot1 = (x1, ROPE_FORWARD_Y, rope_bottom_z)

    # Vertical ropes
    r0 = make_rope_segment(lod, top0, bot0, col)
    r1 = make_rope_segment(lod, top1, bot1, col)
    if r0: parts.append(r0)
    if r1: parts.append(r1)

    # Sagging rope loop between drops (reads as rope, not rigid U-bracket)
    loop_sag = 0.14 if variant == "single" else 0.18
    loop = make_rope_u_loop(lod, bot0, bot1, sag=loop_sag, col=col)
    if loop: parts.append(loop)


    # Tire(s)
    tire_center = (0.0, 0.0, tire1_center_z)

    if lod == 2 and not LOD2_USE_TORUS:
        t1 = make_tire_lod2_shell(tire_center, col)
    else:
        t1 = make_tire_torus(lod, tire_center, col)

    parts.append(t1)

    # Double: second tire below
    if variant == "double":
        tire2_center_z = tire1_center_z - (TIRE_OUTER_D + DOUBLE_GAP_Z)
        tire_center2 = (0.05, 0.0, tire2_center_z)  # slight X offset for variation

        if lod == 2 and not LOD2_USE_TORUS:
            t2 = make_tire_lod2_shell(tire_center2, col)
        else:
            t2 = make_tire_torus(lod, tire_center2, col)
        parts.append(t2)

        # Add a small rope between tires (quick hint)
        mid_rope_top = (0.0, ROPE_FORWARD_Y, tire1_center_z - TIRE_OUTER_D * 0.45)
        mid_rope_bot = (0.0, ROPE_FORWARD_Y, tire2_center_z + TIRE_OUTER_D * 0.45)
        rr = make_rope_segment(lod, mid_rope_top, mid_rope_bot, col)
        if rr: parts.append(rr)

    # Join into one mesh
    merged = join_objects(parts, active_obj=parts[0])
    merged.name = f"{name_base}_lod{lod}"
    add_custom_props(merged, "visual_lod")
    merged["lod"] = lod

    # Bake any location offsets into mesh, then zero loc
    bake_location_into_mesh(merged)

    # Make it look nicer
    if lod == 0:
        bev = merged.modifiers.new(name="Bevel", type='BEVEL')
        bev.width = 0.006
        bev.segments = 1
        bev.limit_method = 'ANGLE'
        bev.angle_limit = math.radians(50.0)

        wn = merged.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')
        wn.keep_sharp = True

        deselect_all()
        merged.select_set(True)
        set_active(merged)
        bpy.ops.object.convert(target='MESH')
        merged.select_set(False)

    shade_smooth_auto(merged, 35.0)
    return merged

def create_collider(parent_obj, name_base: str, variant: str, col):
    """
    Simple box collider enclosing the fender.
    """
    outer_r = TIRE_OUTER_D * 0.5
    w = (outer_r * 2.0) + COLLIDER_MARGIN * 2.0
    d = (TIRE_THICK + ROPE_FORWARD_Y + 0.25) + COLLIDER_MARGIN * 2.0

    # Height depends on variant
    if variant == "single":
        h = (HOOK_TO_TIRE_TOP + TIRE_OUTER_D) + COLLIDER_MARGIN * 2.0
        z_center = -h * 0.5
    else:
        h = (HOOK_TO_TIRE_TOP + (TIRE_OUTER_D * 2.0) + DOUBLE_GAP_Z + TIRE_OUTER_D) + COLLIDER_MARGIN * 2.0
        z_center = -h * 0.5

    bpy.ops.mesh.primitive_cube_add(location=(0.0, d * 0.18, z_center))
    c = bpy.context.active_object
    c.scale = (w * 0.5, d * 0.5, h * 0.5)
    apply_all_transforms(c)

    c.name = f"COLLIDER_{name_base}"
    c.display_type = 'WIRE'
    c.hide_render = True
    link_only_to_collection(c, col)
    add_custom_props(c, "collision")

    c.parent = parent_obj
    c.matrix_parent_inverse = parent_obj.matrix_world.inverted()
    return c

def add_snaps(parent_obj, name_base: str, variant: str, col):
    snap_hook = create_empty(f"SNAP_HOOK_{name_base}", (0.0, 0.0, 0.0), col)

    # Center of first tire
    tire1_center_z = -(HOOK_TO_TIRE_TOP + TIRE_OUTER_D * 0.5)
    snap_center = create_empty(f"SNAP_CENTER_{name_base}", (0.0, 0.0, tire1_center_z), col)

    snap_hook.parent = parent_obj
    snap_center.parent = parent_obj


# ----------------------------
# Main
# ----------------------------
def main():
    ensure_units_meters()
    wipe_collection(COLLECTION_NAME)
    col = create_collection(COLLECTION_NAME)

    init_materials()

    # ---- Single variant ----
    base_single = "harbor_tire_fender_single"
    lod0_s = build_fender(base_single, 0, "single", col)
    lod1_s = build_fender(base_single, 1, "single", col)
    lod2_s = build_fender(base_single, 2, "single", col)

    lod1_s.parent = lod0_s
    lod2_s.parent = lod0_s

    create_collider(lod0_s, base_single, "single", col)
    add_snaps(lod0_s, base_single, "single", col)

    # ---- Double variant ----
    base_double = "harbor_tire_fender_double"
    lod0_d = build_fender(base_double, 0, "double", col)
    lod1_d = build_fender(base_double, 1, "double", col)
    lod2_d = build_fender(base_double, 2, "double", col)

    lod1_d.parent = lod0_d
    lod2_d.parent = lod0_d

    create_collider(lod0_d, base_double, "double", col)
    add_snaps(lod0_d, base_double, "double", col)

    print(f"Created tire fender kit in collection '{COLLECTION_NAME}'.")

if __name__ == "__main__":
    main()
