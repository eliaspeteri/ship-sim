# Layer System

## Purpose

The **Layer System** defines how map content is organized, typed, styled, edited, validated, compiled, and streamed.

It provides:

- A consistent abstraction for all overlay content (ports, nav aids, rules, decor, etc.)
- Strong typing and schema control (avoid “random JSON”)
- A unified way to:
  - render content in the editor
  - render content at runtime
  - compile content into tile-aligned artifacts
  - validate content against rules

The Layer System is the bridge between:

- **Map Packs** (container + versions)
  and
- **Features** (the atomic objects within layers)

---

## Scope

### In scope

- Layer definitions and metadata
- Layer types and their geometry modes
- Layer schemas and versioning
- Layer-level styling rules (editor + runtime)
- Layer-level visibility/locking controls (editor)
- Layer build/compilation configuration
- Layer loading/streaming contract (what compiled layers look like per tile)

### Out of scope

- Feature geometry editing (covered by tools + feature-model)
- Pack lifecycle (covered by map-packs)
- Compilation implementation details (covered by overlay-compilation)
- Collaboration protocols (covered by collaboration)
- Domain validation rules (covered by validation-engine)

---

## Core Concepts

### What is a Layer?

A **Layer** is a typed collection of features that share:

- A schema (properties + geometry constraints)
- A rendering approach (icons, lines, polygons, instances, rasters)
- Build rules (how it compiles into runtime-friendly tile chunks)

Examples:

- `NavAidLayer` (points: buoys/beacons/lights)
- `SpeedZoneLayer` (polygons: speed limits)
- `BerthLayer` (polylines: berth edges)
- `BiomePaintLayer` (raster masks: biome IDs)
- `ClearanceZoneLayer` (volumes: vertical constraints)

---

## Layer Identity & Ownership

Layers are owned by a **Pack Version**.

- A pack can contain many layers
- A layer belongs to exactly one pack version
- Published pack versions are immutable, therefore published layers are immutable

### Layer Identifiers

Each layer must have:

- `layerId` (UUID) – stable within the pack version
- `type` (string enum) – defines schema + behavior
- `name` – human readable
- `schemaVersion` – for migrations and compatibility
- `createdAt`, `updatedAt` (draft only)

**Important:** Feature IDs must remain stable across edits; layer IDs may change across pack versions.

---

## Layer Types

A layer type defines the “contract” for:

- allowed geometry
- allowed properties
- render style defaults
- compilation strategy
- validation hooks

### Geometry Modes

Each layer type must declare one geometry mode:

- `point`
- `polyline`
- `polygon`
- `volume` (extruded polygon or 3D shape)
- `raster` (paint/mask)
- `instance` (procedural/placed instances; may compile to points/instances)

**Rule:** A single layer should not mix geometry modes. If you need mixed geometry, use separate layers.

---

## Schema & Strong Typing

### Why schemas exist

Schemas prevent:

- inconsistent data
- UI ambiguity
- runtime assumptions breaking
- impossible validation

A schema determines:

- property names and types
- required vs optional fields
- constraints (ranges, enums)
- geometry constraints (e.g. polygon must be closed, no self-intersections, etc.)

### Schema Representation

At minimum, each layer type should have a schema definition that can be used by:

- editor inspector UI (forms)
- validation engine
- compiler

This can be represented as:

- JSON schema-like structures, or
- TypeScript types + runtime validators (recommended)

### Schema Versioning

Each layer stores a `schemaVersion`.

- Draft data may be migrated forward when opening in editor
- Published data should remain readable forever (support migrations at load-time or compile-time)

**Policy recommendation:**

- Only allow schemaVersion bumps that are backward readable
- For breaking changes, introduce a new layer type or new schemaVersion with explicit migration logic

---

## Layer Metadata & Configuration

Each layer includes:

### Base Metadata

- `layerId`
- `type`
- `name`
- `schemaVersion`

### Editor Configuration

- `isVisible` (per-user, editor-only)
- `isLocked` (per-user, editor-only)
- `opacity` (editor-only, optional)

Note: editor visibility/lock should not be stored in the pack version as shared state unless intentionally collaborative. Prefer storing editor UI state client-side (or per-user server state).

### Build Configuration

Layer build config influences compilation:

- `minZoom`, `maxZoom` (where this layer produces artifacts)
- `lodPolicy` (simplification / clustering rules)
- `tileIndexPolicy` (spatial indexing strategy)
- `renderHints` (optional; e.g. icon atlas selection, label rules)

Build config must be deterministic and stable for published versions.

---

## Styling

Layers support styling in two scopes:

- **Editor style**
- **Runtime style**

### Style Goals

- Make layers readable and distinct

---

## Implementation Checklist

- [ ] Layer type registry
- [ ] Geometry mode enforcement
- [ ] Visibility and lock state
- [ ] Style configuration (editor + runtime)
- [ ] Schema version + migrations
- Keep runtime performant
- Allow per-layer customization without forking layer types

### Recommended Style Fields (Examples)

- `color` (optional)
- `lineWidth` (optional)
- `iconId` (for points)
- `labelRules` (optional: show/hide/format)
- `zOrder` / draw priority
- `visibilityByZoom` overrides

**Important:** Style should not affect gameplay semantics.
Gameplay uses feature properties and runtime rules, not style.

---

## Layer Panel Requirements (Editor UI)

The layer panel must support:

- Show list of layers in current pack version
- Grouping by high-level category:
  - Terrain (read-only; not part of pack)
  - Decor
  - Infra
  - Port
  - Navigation
- Toggle visibility (editor-only)
- Toggle lock (editor-only)
- Filter by type/category
- Show validation status per layer:
  - OK / warnings / errors
- Reorder layers visually (optional)

**Note:** Layer ordering is a UI preference; actual runtime precedence is managed by pack/space precedence rules, not the layer panel order.

---

## Validation Hooks

The layer system provides hook points for validation:

- `validateFeature(feature)` – type + schema validation
- `validateLayer(layer)` – layer-level consistency (e.g. build config sanity)
- `validateCrossLayer(packVersion)` – optionally handled by validation engine, but layer types should expose their constraints

Layer validation responsibilities:

- enforce schema correctness
- enforce geometry mode
- enforce property constraints

Cross-layer or gameplay validation is handled by the validation engine.

---

## Compilation Contract (Layer → Tile Artifacts)

### Source Form

Source form is editable data:

- vector layers: features (geometry + properties)
- raster layers: paint data (stored as chunks)
- instance layers: procedural intent + seeds (preferred)

### Compiled Form

Compiled form is tile-aligned and LOD-aware:

- output is a set of tile artifacts per layer or per category
- artifacts include:
  - simplified geometry
  - packed properties
  - spatial index
  - metadata for rendering and queries

### Per-Tile Payload Expectations

A compiled tile artifact should contain:

- `tileId` (z/x/y)
- `layerId` (or layer group id)
- `schemaVersion`
- `lodLevel` (or implied by zoom)
- `featureRecords` (packed)
- `spatialIndex` (for picking/queries)
- `bounds` (optional)

**Policy:** compiled artifacts must be deterministic given the same source and build config.

---

## Loading Contract (Runtime & Editor)

The layer system defines how the loader interprets compiled artifacts:

- Identify which tiles are needed based on camera + zoom policy
- Fetch compiled artifacts for enabled packs (space config)
- Merge artifacts by precedence (handled outside layer system)
- Render each layer using its type’s renderer

Layer type must define:

- how to render compiled records
- which properties are required at runtime
- which records are queryable (e.g. nearest buoy)

---

## Conflict & Precedence Awareness

The layer system itself does not resolve pack conflicts, but it must support:

- deterministic merging within a pack version
- stable feature identity
- optional layer-level conflict detection rules (e.g. “ports should not overlap”)

Actual precedence is handled by the pack/space composition system.

---

## Data Storage Model (Layer Perspective)

Within a pack version:

- `Layer` table stores layer metadata, schemaVersion, style, build config
- `Feature` table stores vector features keyed by layerId
- `RasterChunk` stores raster tiles keyed by layerId + tileZXY
- `BuildArtifact` stores compiled outputs keyed by packVersionId + tileZXY (optionally includes multiple layers in one artifact)

---

## Migration & Backward Compatibility

### Goals

- Old published packs continue to load
- Editor can open old versions without data loss

### Strategy

- Keep schema migrations explicit and tested
- Prefer additive schema changes
- For breaking changes:
  - introduce new layer type or schemaVersion
  - provide migration on “open draft from old version” only

---

## Non-Goals

The layer system does not:

- implement drawing tools
- implement selection logic
- implement compilation algorithms
- define collaboration protocols
- define server APIs in detail

It defines the contracts those systems rely on.

---

## Dependencies

Depends on:

- Map Packs (versions, ownership)
- Coordinate system conventions (WGS84 + local projection)
- Storage primitives (DB + blob storage)

Depended on by:

- Feature model (geometry + properties)
- Tooling system (creation/editing)
- Validation engine
- Compilation pipeline
- Runtime overlay loader

---

## Success Criteria

The layer system is complete when:

- Every editor feature can be expressed as a layer type
- Layer schemas are strict and drive UI + validation
- Layers compile deterministically into tile artifacts
- Runtime can load and render layers without editor-only assumptions
- The layer panel can reliably control visibility/locking without corrupting pack data

---

**End of document.**
