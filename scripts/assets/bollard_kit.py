import bpy
import math
from mathutils import Vector

# ----------------------------
# Config / Conventions
# ----------------------------
COLLECTION_NAME = "Bollards"
FORWARD_AXIS = "+Y"  # Convention tag (bollards are point props, so forward isn't critical)

# Realistic-ish dimensions (meters)
VARIANTS = [
    # name, base_d, body_d, top_d, height, cap_h, horn_d, horn_len, horn_z
    ("Bollard_Light",    0.28, 0.24, 0.22, 0.55, 0.05, 0.08, 0.18, 0.32),
    ("Bollard_Standard", 0.36, 0.30, 0.28, 0.75, 0.06, 0.10, 0.22, 0.44),
    ("Bollard_Heavy",    0.50, 0.42, 0.40, 0.95, 0.07, 0.14, 0.28, 0.56),
]

# LOD decimation ratios (applied to duplicates)
LOD_RATIOS = [
    ("LOD1", 0.45),
    ("LOD2", 0.20),
]

# Cylinder segment counts
SEGMENTS_LOD0 = 48
SEGMENTS_COLLIDER = 12
METAL_MATERIAL_NAME = "Bollard_Metal"


# ----------------------------
# Helpers
# ----------------------------
def force_into_collection(obj: bpy.types.Object, col: bpy.types.Collection):
    # Unlink from any other collections
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)

def wipe_collection(name: str):
    """
    Deletes a collection and all objects inside it (idempotent runs).
    """
    col = bpy.data.collections.get(name)
    if not col:
        return

    # Delete objects in the collection
    objs = list(col.objects)
    if objs:
        ensure_object_mode()
        deselect_all()
        for o in objs:
            o.select_set(True)
        bpy.ops.object.delete()
        # Remove leftover datablocks if they have no users
        for o in objs:
            if o and o.users == 0:
                bpy.data.objects.remove(o, do_unlink=True)

    # Unlink and remove the collection itself
    # (must unlink from any parents first)
    for scene in bpy.data.scenes:
        if col.name in scene.collection.children.keys():
            scene.collection.children.unlink(col)

    for parent_col in bpy.data.collections:
        if col.name in parent_col.children.keys():
            parent_col.children.unlink(col)

    bpy.data.collections.remove(col)

def purge_bollard_objects():
    prefixes = ("Bollard_", "COLLIDER_Bollard_", "SNAP_BASE_Bollard_")
    ensure_object_mode()
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)

def create_snap_base(parent: bpy.types.Object, asset_name: str):
    deselect_all()
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0.0, 0.0, 0.0))
    e = bpy.context.active_object
    e.name = f"SNAP_BASE_{asset_name}"
    add_custom_props(e, "snap_point")
    e.parent = parent
    e.matrix_parent_inverse = parent.matrix_world.inverted()
    return e

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


def set_origin_to_base_center(obj: bpy.types.Object):
    """
    Moves geometry so that object origin is at base center on Z=0,
    and places object at world origin.
    """
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Apply transforms first for predictable results
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    # Compute bounding box min Z in local space, then shift mesh up/down so minZ -> 0
    # bbox corners are in local space
    min_z = min(v[2] for v in obj.bound_box)
    # Shift object data
    if obj.type == 'MESH':
        for v in obj.data.vertices:
            v.co.z -= min_z

    # Now origin at current object origin; we want it at base center.
    # Center XY by moving vertices by the object's origin offset in local space:
    # We'll compute mesh bounds center in XY and recenter.
    if obj.type == 'MESH':
        xs = [v.co.x for v in obj.data.vertices]
        ys = [v.co.y for v in obj.data.vertices]
        cx = (min(xs) + max(xs)) * 0.5
        cy = (min(ys) + max(ys)) * 0.5
        for v in obj.data.vertices:
            v.co.x -= cx
            v.co.y -= cy

    # Place object at world origin
    obj.location = (0.0, 0.0, 0.0)

    obj.select_set(False)


def add_custom_props(obj: bpy.types.Object, asset_role: str):
    obj["asset_role"] = asset_role          # e.g. "visual", "collision"
    obj["units"] = "meters"
    obj["forward_axis"] = FORWARD_AXIS


def shade_smooth_with_autosmooth(obj: bpy.types.Object, angle_deg: float = 40.0):
    if obj.type != 'MESH':
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    
    # Blender 4.1+ / 5.0: Auto Smooth moved to "Smooth by Angle"
    bpy.ops.object.shade_auto_smooth(use_auto_smooth=True, angle=math.radians(angle_deg))
    
    obj.select_set(False)

def get_or_create_metal_material(name: str = METAL_MATERIAL_NAME) -> bpy.types.Material:
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
        bsdf.inputs["Base Color"].default_value = (0.35, 0.37, 0.40, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.95
        bsdf.inputs["Roughness"].default_value = 0.35
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
# Bollard builder
# ----------------------------
def build_bollard_mesh(name: str, base_d: float, body_d: float, top_d: float,
                       height: float, cap_h: float, horn_d: float, horn_len: float,
                       horn_z: float, col: bpy.types.Collection,
                       segments: int = SEGMENTS_LOD0) -> bpy.types.Object:
    """
    Creates a simple twin-horn mooring bollard:
    - base flange (short cylinder)
    - tapered body (cone-like via cylinder + scale top)
    - cap (short cylinder)
    - two horns (cylinders)
    """
    deselect_all()

    # Base flange
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=segments, radius=base_d * 0.5, depth=cap_h, location=(0, 0, cap_h * 0.5)
    )
    base = bpy.context.active_object
    base.name = f"{name}__base"
    force_into_collection(base, col)

    # Body (tapered) as a truncated cone
    body_h = max(0.01, height - (cap_h * 2.0))  # leave room for base + cap
    bpy.ops.mesh.primitive_cone_add(
        vertices=segments,
        radius1=body_d * 0.5,     # bottom radius
        radius2=top_d * 0.5,      # top radius
        depth=body_h,
        location=(0, 0, cap_h + body_h * 0.5)
    )
    body = bpy.context.active_object
    body.name = f"{name}__body"
    force_into_collection(body, col)

    # Cap (small cylinder on top)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=segments,
        radius=top_d * 0.5,
        depth=cap_h,
        location=(0, 0, cap_h + body_h + cap_h * 0.5)
    )
    
    cap = bpy.context.active_object
    cap.name = f"{name}__cap"
    force_into_collection(cap, col)

    # Horns: two cylinders crossing along X
    # Keep horns slightly embedded for a welded look; add a small collar/flare.
    horn_len_eff = max(horn_len, body_d * 0.6)
    embed = min(horn_len_eff * 0.25, 0.01)  # ~1 cm embed
    horn_offset = (body_d * 0.5) + (horn_len_eff * 0.5) - embed
    collar_r = horn_d * 0.65
    collar_h = max(0.012, horn_d * 0.25)
    # Left horn
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=max(16, segments // 3),
        radius=horn_d * 0.5,
        depth=horn_len_eff,
        location=(0, 0, horn_z),
        rotation=(0, math.radians(90), 0)  # rotate so depth aligns with X
    )
    
    horn1 = bpy.context.active_object
    horn1.name = f"{name}__horn1"
    horn1.location.x = -horn_offset
    force_into_collection(horn1, col)

    # Collar for horn1
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=max(16, segments // 3),
        radius=collar_r,
        depth=collar_h,
        location=(-body_d * 0.5, 0, horn_z),
        rotation=(0, math.radians(90), 0)
    )
    collar1 = bpy.context.active_object
    collar1.name = f"{name}__collar1"
    force_into_collection(collar1, col)

    # Right horn
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=max(16, segments // 3),
        radius=horn_d * 0.5,
        depth=horn_len_eff,
        location=(0, 0, horn_z),
        rotation=(0, math.radians(90), 0)
    )
    
    horn2 = bpy.context.active_object
    horn2.name = f"{name}__horn2"
    horn2.location.x = horn_offset
    force_into_collection(horn2, col)

    # Collar for horn2
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=max(16, segments // 3),
        radius=collar_r,
        depth=collar_h,
        location=(body_d * 0.5, 0, horn_z),
        rotation=(0, math.radians(90), 0)
    )
    collar2 = bpy.context.active_object
    collar2.name = f"{name}__collar2"
    force_into_collection(collar2, col)

    ensure_object_mode()

    # Join parts into one mesh
    deselect_all()
    for o in (base, body, cap, horn1, horn2, collar1, collar2):
        o.select_set(True)
    bpy.context.view_layer.objects.active = base
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    if obj.data:
        obj.data.name = name

    # Cleanup: bevel to catch highlights
    bevel = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = min(0.01, base_d * 0.04)
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(45)

    # Weighted normals helps hard-surface shading
    wn = obj.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')
    wn.keep_sharp = True

    # Apply modifiers for export-friendly meshes (optional; keep applied here)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)

    set_origin_to_base_center(obj)
    shade_smooth_with_autosmooth(obj, 35.0)
    add_custom_props(obj, "visual")
    assign_material(obj, get_or_create_metal_material())

    return obj


def create_collision_cylinder(parent: bpy.types.Object, name: str, radius: float, height: float, col: bpy.types.Collection):
    deselect_all()
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=SEGMENTS_COLLIDER, radius=radius, depth=height, location=(0, 0, height * 0.5)
    )
    
    collider = bpy.context.active_object
    force_into_collection(collider, col)
    collider.name = f"COLLIDER_{name}"
    set_origin_to_base_center(collider)
    add_custom_props(collider, "collision")

    # Parent to visual
    collider.parent = parent
    collider.matrix_parent_inverse = parent.matrix_world.inverted()

    # Display settings: wireframe / hidden in renders
    collider.display_type = 'WIRE'
    collider.hide_render = True
    return collider


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
    assign_material(dup, get_or_create_metal_material())
    return dup


# ----------------------------
# Main
# ----------------------------
def main():
    ensure_units_meters()
    
    purge_bollard_objects()
    wipe_collection(COLLECTION_NAME)

    col = get_or_create_collection(COLLECTION_NAME)

    # Make sure new objects link into our collection (and not only the active context collection)
    # We'll create in the scene collection then move to our collection.
    created_roots = []

    for spec in VARIANTS:
        (name, base_d, body_d, top_d, height, cap_h, horn_d, horn_len, horn_z) = spec

        # Build LOD0
        lod0 = build_bollard_mesh(
            name=name,
            base_d=base_d, body_d=body_d, top_d=top_d,
            height=height, cap_h=cap_h,
            horn_d=horn_d, horn_len=horn_len, horn_z=horn_z,
            col=col
        )
        lod0.name = f"{name}_LOD0"
        lod0["asset_name"] = name
        lod0["lod"] = 0

        # Move to collection
        for c in lod0.users_collection:
            c.objects.unlink(lod0)
        col.objects.link(lod0)
        
        snap = create_snap_base(lod0, name)
        for c in snap.users_collection:
            c.objects.unlink(snap)
        col.objects.link(snap)


        # Collision (simple cylinder around body)
        # radius = max diameter / 2 * 1.05
        collider_radius = (max(body_d, base_d) * 0.5) * 1.05
        collider_height = height
        collider = create_collision_cylinder(lod0, name, collider_radius, collider_height, col)
        for c in collider.users_collection:
            c.objects.unlink(collider)
        col.objects.link(collider)

        # LOD1 / LOD2
        for lod_name, ratio in LOD_RATIOS:
            lod = duplicate_with_decimate(lod0, f"{name}_{lod_name}", ratio, col)
            lod["asset_name"] = name
            lod["lod"] = int(lod_name[-1])  # "LOD1" -> 1, "LOD2" -> 2

            # Keep same pivot/origin; place at origin
            lod.location = (0, 0, 0)

            # Link to collection
            for c in lod.users_collection:
                c.objects.unlink(lod)
            col.objects.link(lod)

            # Parent LODs to LOD0 for organization
            lod.parent = lod0
            lod.matrix_parent_inverse = lod0.matrix_world.inverted()

        created_roots.append(lod0)

    print(f"Created {len(created_roots)} bollard variants in collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
