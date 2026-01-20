# Map editor

## Next.js pages

The map editor will be its own page in the main Next.js. Full list of pages:

- `/editor` - main editor UI
- `/editor/packs` - pack list, create, update permissions
- `/editor/packs/[packId]` - pack details, layers, upload/download
- `/editor/review` - review changes from collaborators

## Map packs

Map packs can be defined as public or private. Public packs can be shared with the community, while private packs are only accessible to the creator and collaborators.

If a map pack is made public, it will appear in a list of community maps that other users can browse and download. These will be accessible in private spaces.

### Roles

Gated by:

- server-side role checks
- client-side UI restrictions

#### Who can create or edit maps?

Map creators must have a player role or higher.

#### Who can review maps?

There will be a new role called "reviewer" that can review and approve or request map changes. This is only if map pack is aimed as a change request for global.

#### Who can publish maps?

This would be limited to "admin" role for now. Admins can:

- create map packs aimed for "global". These packs can and should be reviewed by other reviewers.
- assign "reviewer" roles to other users.
- push approved packs to "global".

## Scope

### Layers

The map editor sits on top of read-only Earth tiles terrain + bathymetry. It has several layers:

- Terrain layer (read-only)
- Decor layer (vegetation, props, masks, roads, buildings)
- Infra layer (docks, piers, bridges, cables, clearance volumes)
- Port definition layer (port boundaries, berths, mooring points, fenders)
- Navigation layer (aids, constraints, rules, routes, areas)

### WYSIWYG editing

Runtime and editor use the same streaming + LOD system for terrain and bathymetry, so what you see in the editor is what you get in runtime.

## Mental model

Everything is a layer. You have a base layer, then you have overlays with a set structure:

- a type (e.g., BuoyLayer, PortLayer, VegetationMaskLayer)
- a spatial representation (points/lines/polygons/rasters/instances/volumes)
- style rules (how it renders in-editor and in-game)
- build rules (how it compiles into runtime-friendly chunks)

Finally you have compiled runtime artifacts that are optimized for streaming and rendering. So, editor takes in and saves source data, but compiles it into runtime data which has following properties:

- tile-aligned chunks for streaming
- LOD levels for performance
- packed metadata
- fast spatial indices

## Coordinate system

Globally WGS84 lat/lon/alt coordinates. Locally, each tile uses a projected coordinate system (e.g., UTM or ENU) for accuracy. It should be anchored at the work area center to minimize floating point precision issues.

Editor shows both global and local coordinates for reference. Tools operate in local coordinates for precision (snapping, distances, polygons).

## Tiling scheme

<!-- I don't understand this -->

Web Mercator slippy tiles (z/x/y). Can still store exact geometry in WGS84 and index it into tiles for streaming.

<!-- I don't understand this -->

Overlays are stored as features, but compiled per tile at target zoom levels.

## Wishlist

### Viewport

- 3D world view (ship-sim renderer)
- Minimap (2D top-down)
- Tile boundary overlay + current loaded LOD
- “Data inspector” tooltip under cursor (depth from bathy, clearance, zone membership, nearest nav aid)

### Layer panel

- Visibility / lock / opacity
- Filter by type (Decor / Infra / Port / Nav)
- Per-layer style overrides (icons, colors, label rules)
- Validation status per layer (green/yellow/red)

### Tool system (mode-based)

A left toolbar with GIS-like tools:

#### Common

- Select / Multi-select / Lasso
- Move / Rotate / Scale (with snapping)
- Duplicate / Array along path
- Measure distance / bearing / area
- Snap settings: grid / coastline / depth contour / existing geometry

#### Geometry authoring

- Point tool (buoy, beacon, tower)
- Polyline tool (cables, pipelines, fairways)
- Polygon tool (zones, masks, anchorages)
- Volume tool (clearance volumes, bridge envelopes)

#### Painting

- Biome brush (writes to raster mask)
- No-decoration mask brush
- Density brush for clutter
- “Stamp” brush for prop sets (rocks, shoreline packs)

#### Procedural helpers

- Scatter along coastline
- Scatter inside polygon with density map
- Place along polyline at interval (buoy chains, posts)
- “Generate dock edges” from a drawn quay line

### Property inspector (the “truth panel”)

Select an object, edit typed properties:

- Buoy: IALA region, light characteristics, topmark, radar reflector
- Bridge: min vertical clearance, horizontal clearance corridor, span type
- Cable: min clearance curve, sag model params (optional), warning zones
- Port: name/region, services, VHF channels, rules, tug availability, etc.

### Validation & simulation preview

This is where the editor becomes more than a placement tool.

- Click “Validate”: checks constraints (see below)
- Click “Preview”: spawn a test ship and run:
  - “Can I transit here?” along a path
  - Depth clearance along route vs draft
  - Overhead clearance along route vs mast height
  - Speed zone compliance overlay

Examples:

- Buoy must have valid IALA region + light pattern format
- Berths must be within a Port boundary
- Bridge clearance envelope must not intersect terrain (unless supported)
- Overhead cable must not dip below its stated minimum clearance
- Speed zones should not overlap with contradictory rules (or must be ordered)
- Restricted zones must declare “allowed vessel classes” or “exceptions”
- Anchorage depth must be within [min,max] computed from bathymetry sampling

Add a “Fix suggestions” panel:

- “Move buoy to nearest safe-depth contour”
- “Extend speed zone to shoreline to avoid sliver gaps”
- “Snap berth line to dock edge”

## Data model: features + schemas (make it boring and strict)

### Authoring format

Use something like:

- project.json (work areas, tile sources, layer list, settings)
- layers/\<layer-id>.geojson for vector features (points/lines/polys)
- layers/\<layer-id>.mask.tiff or custom chunked raster for paint layers
- assets/ for custom props/prefabs references
- build/ for compiled artifacts

GeoJSON great for early prototyping, later advance to binary format for big layers.

### Strong typing (don’t let “random JSON” creep in)

Define a schema per layer type:

- BuoyFeature
- BerthFeature
- ClearanceZoneFeature
  etc.

Then your editor can:

- show correct UI controls
- validate reliably
- compile deterministically

### Core tables (Prisma-ish)

- Pack (id, name, description, region bbox, ownerId, visibility)
- PackMember (packId, userId, role: owner/editor/viewer)
- PackVersion (packId, version, status: draft|submitted|published, createdAt, createdBy)
- Layer (packVersionId, id, type, name, style, schemaVersion)
- Feature (layerId, id, geometry, properties, updatedAt) — vector
- RasterChunk (layerId, tileZXY, blobRef, metadata) — paint layers
- BuildArtifact (packVersionId, tileZXY, blobRef, indexRef, buildMeta)

### Storage

- Postgres for metadata + vector features (JSONB is fine early)
- Large blobs (compiled chunks, raster tiles) in object storage (S3/R2/etc.)
- CDN in front for published content

This also makes “global map overlays” just: “load all published pack artifacts that intersect the area”.

## Streaming + LOD: “tile-aligned everything”

This is the backbone of “Earth-data-backed” + large worlds.

### At runtime (and in editor)

- Determine visible tiles at current camera + LOD.
- For each tile:
  - load base terrain/bathy (already in your assumptions)
  - load overlay chunks for that tile (per layer or merged per category)

### LOD strategy (overlays)

- Points: cluster at low zoom, expand at high zoom
- Lines/polys: simplify geometry per zoom (Douglas-Peucker-like)
- Instances: density reduction at distance, impostors beyond a threshold
- Rasters (masks): mipmapped tile pyramids

## Layer types

### Decor & atmosphere

- BiomePaintLayer (raster mask: biome id)
- VegetationScatterLayer (procedural scatter rules + seeds)
- ClutterLayer (instanced props, can be hand-placed or procedural)
- NoDecorationMaskLayer (raster + polygon “exclusion”)

Practical trick: store procedural intent (seed + rules) rather than millions of instances; compile instances per-tile.

### Structures & clearance

- BridgeLayer (bridge geometry + clearance envelope)
- OverheadLineLayer (polyline with clearance curve and corridor width)
- VerticalObstacleLayer (towers/masts/chimneys with height)
- ClearanceZoneLayer (3D volumes or extruded polygons with min clearance)

Gameplay integration: clearance becomes a queryable field: “min overhead clearance at (x,y)”.

### Ports & infrastructure

- PortLayer (port entity + polygon boundary)
- BerthLayer (berth polylines + metadata like max LOA, depth, fenders)
- DockLayer (physical collision meshes / simplified shapes)
- MooringLayer (points with type: bollard/cleat/mooring buoy)
- AnchorageLayer (polygons with depth constraints, rules)
- PortServiceLayer (service metadata attached to port or subareas)

### Navigation aids & constraints

- NavAidLayer (buoys, beacons, lighthouses)
- SpeedZoneLayer (polygons with speed limit, conditions)
- RestrictedZoneLayer (polygons, rules, enforcement behavior)
- DepthConstraintLayer (polygons/contours with min depth requirement)
- TrafficSeparationLayer (optional later: lanes, directions)

## Collaboration & workflows (ultimate version)

- Overlay packs as units of distribution (a “Helsinki Port Pack”)
- Layer-level ownership + locking
- Git-friendly diffs (stable ordering, stable IDs, minimal noise)
- Optional “live multi-user”: CRDT/OT is nice, but you can get far with:
  - per-layer locks
  - “pull latest + resolve conflicts” tooling

### MVP collab model (works well)

- Presence: who’s in the pack and where their camera is
- Soft locks: when someone selects a feature, it’s “locked” for others
- Change feed: broadcast feature edits as small patches

Conflicts become rare because:

- features are small atomic units (point/polyline/polygon)
- soft locks + “last write wins” with warnings covers most cases

Later, if you want serious multi-user editing: add operation logs and replay, but don’t start there.

## Review & publishing workflow

### Submission = immutable snapshot

When user submits:

- freeze a PackVersion as submitted
- run validation + compile artifacts
- create a review record: Submission(packVersionId, notes, status)

### Reviewer UI needs 3 things

1. Diff view vs last published (added/modified/deleted features)
2. Validation report (errors/warnings)
3. In-world preview (spawn in editor with that version loaded)

### Approval path

- Request changes → user continues from draft
- Approve → status becomes published
- Optional “promote to global curated set” flag

## Build-out plan

### Phase 1: MVP “Nav + Zones”

- Point tool: buoys/beacons/lighthouses
- Polygon tool: speed zones, restricted zones
- Property panel + basic validation
- Save/load project, tile streaming integration

### Phase 2: Ports

- Port definitions + berths/docks/anchorages
- Snapping + measuring tools
- Query hooks used by gameplay (“nearest berth”, “is in port services area”)

### Phase 3: Clearance

- Bridges + overhead lines + clearance zones
- Runtime queries (“min clearance along route”)
- Editor heatmap overlays for clearance conflicts

### Phase 4: Decor painting

- No-decoration masks first (cheap + very useful)
- Biome painting
- Procedural scatter compilation per-tile

### Phase 5: Procedural power tools

- Scatter along shoreline
- Auto-place nav aids along fairway
- Import external vector data (e.g., GeoJSON) into layers

## Open questions

- What are masks in the decor layer?
- What are clearance volumes in the infra layer?
- What are fenders in the port definition layer?
- What are constraints in the navigation layer?
- What are UTM or ENU coordinate systems? And what are projected coordinate systems?
- What is zone membership?
- Different kind of sag model params for cables?
- Isn't tug availability defined by port services? AKA players online and available in the port? Or does this refer to the AI services?
  What is CRDT?
