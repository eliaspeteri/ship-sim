# Ship Simulator – Map Editor Design & Implementation Guide

This document defines the **architecture, concepts, workflows, and implementation details** for a fully fledged, in-browser map editor for _ship-sim_.  
It is intended to serve both as **product documentation** and as **technical instructions** for building the system from start to finish.

The editor is **Earth-data-backed**, **overlay-only**, **tile-streamed**, and designed for **online collaboration and curation**, not free-form world sculpting.

---

## Table of Contents

1. [What the Map Editor Is (and Is Not)](#what-the-map-editor-is-and-is-not)
2. [High-Level Goals](#high-level-goals)
3. [System Overview](#system-overview)
4. [Editor Pages & Routing](#editor-pages--routing)
5. [Map Packs](#map-packs)
   - Work Areas
   - Visibility Levels
   - Roles & Permissions
6. [Core Concepts](#core-concepts)
   - Layers
   - Features
   - Source vs Compiled Data
7. [Coordinate Systems](#coordinate-systems)
8. [Tiling & LOD Model](#tiling--lod-model)
9. [Editor UI & Tooling](#editor-ui--tooling)
10. [Layer Types](#layer-types)
11. [Validation & Simulation Preview](#validation--simulation-preview)
12. [Data Model & Storage](#data-model--storage)
13. [Streaming & Runtime Integration](#streaming--runtime-integration)
14. [Compilation Pipeline](#compilation-pipeline)
15. [Collaboration Model](#collaboration-model)
16. [Review & Publishing Workflow](#review--publishing-workflow)
17. [Modding & Community Content](#modding--community-content)
18. [Moderation & Safety](#moderation--safety)
19. [Asset Creation & Usage](#asset-creation--usage)
20. [Build-Out Phases](#build-out-phases)
21. [Glossary of Concepts](#glossary-of-concepts)

---

## What the Map Editor Is (and Is Not)

### The Map Editor **is**

- A **non-destructive overlay authoring tool**
- Built directly into the **ship-sim frontend**
- Backed by **real Earth terrain and bathymetry**
- Designed for **ports, navigation aids, infrastructure, and rules**
- **Server-authoritative** for published content
- Built around **tile-based streaming and LOD**
- Designed for **collaboration, review, and curation**

### The Map Editor **is not**

- A terrain sculptor (no heightmap editing)
- A general-purpose 3D modeling tool
- A scripting or code-execution platform
- A client-authoritative mod system
- A free-for-all global editor without review

---

## High-Level Goals

- Allow players to author **realistic maritime content**
- Ensure **WYSIWYG parity** between editor and runtime
- Scale to **planet-sized worlds**
- Support **community contributions** without compromising integrity
- Keep all authored content **data-driven and deterministic**
- Enable **strong validation** for maritime correctness

---

## System Overview

The editor operates on top of **read-only Earth tiles** and produces **overlay packs** that are streamed exactly like terrain and bathymetry.

Key pillars:

- **Layers** as the fundamental abstraction
- **Map Packs** as units of authorship and distribution
- **Tile-aligned compilation** for performance
- **Server-side authority** for anything shared globally

---

## Editor Pages & Routing

All editor functionality lives inside the main Next.js application.

### Routes

- `/editor/packs`
  - List, create, and manage map packs
- `/editor/packs/[packId]`
  - Main editor workspace:
    - 3D viewport
    - Layer panel
    - Tools
    - Inspector
- `/editor/review`
  - Review queue for submissions
  - Only accessible to reviewers and admins

---

## Map Packs

A **Map Pack** is the primary unit of content creation and distribution.

It contains:

- One or more **work areas**
- A set of **layers**
- Versioned history (drafts, submissions, published)

### Work Areas

A work area defines:

- Geographic bounds (polygon or bbox)
- Tile sources (terrain, bathymetry, imagery)
- Allowed zoom levels

Purpose:

- Restrict editing to a known region
- Limit compilation scope
- Optimize streaming and prefetching
- Prevent accidental “edit half the planet” mistakes

Editor behavior:

- Warn on out-of-bounds edits
- Clamp compilation to work area tiles

### Visibility Levels

Each pack has exactly one visibility state per version:

1. **Private Draft**
   - Only creator and collaborators
2. **Published Public**
   - Discoverable by all users
   - Loadable in private sessions
3. **Global Curated**
   - Reviewed and approved
   - Included in default global overlays

### Roles & Permissions

There are **two separate role systems**:

#### Site Roles (platform-wide)

- `player`
- `reviewer`
- `admin`

#### Pack Roles (per-pack)

- `owner`
- `editor`
- `viewer`

Capabilities:

| Capability         | Player | Reviewer | Admin |
| ------------------ | ------ | -------- | ----- |
| Create/edit packs  | ✅     | ✅       | ✅    |
| Submit for review  | ✅     | ✅       | ✅    |
| Review submissions | ❌     | ✅       | ✅    |
| Publish to global  | ❌     | ❌       | ✅    |
| Assign reviewers   | ❌     | ❌       | ✅    |

All permissions are enforced:

- Server-side (authoritative)
- Client-side (UI gating)

---

## Core Concepts

### Layers

Everything authored lives in a **layer**.

A layer defines:

- A **type** (e.g. `NavAidLayer`)
- A **geometry model**
- **Style rules**
- **Build rules**

Layers are independent, composable, and streamable.

### Features

A **feature** is an atomic piece of authored data:

- A buoy
- A speed zone polygon
- A berth line
- A clearance volume

Features:

- Have stable UUIDs
- Contain geometry + typed properties
- Are the unit of diffing and validation

### Source vs Compiled Data

- **Source data**
  - Editable
  - High fidelity
  - Stored as features
- **Compiled data**
  - Tile-aligned
  - LOD-reduced
  - Indexed for fast queries

Source data is never used directly at runtime.

---

## Coordinate Systems

### Global Coordinates

- WGS84 latitude / longitude / altitude
- Used for identity, storage, and interoperability

### Local Coordinates

- Projected coordinate system per work area
- ENU (East-North-Up) or UTM
- Used by editor tools for:
  - Snapping
  - Distances
  - Geometry math

The editor displays both for clarity.

---

## Tiling & LOD Model

### Web Mercator Slippy Tiles

The world is divided into tiles using:

- Zoom (`z`)
- X index (`x`)
- Y index (`y`)

This matches:

- Earth tile servers
- Caching infrastructure
- Mental model of map navigation

### Feature-to-Tile Compilation

Authoring model:

- One feature = one logical object

Runtime model:

- Feature is split, simplified, and packed into per-tile chunks:
  `/overlays/z12/x1234/y1533.nav.bin`

Each chunk contains:

- Geometry relevant to that tile
- LOD-appropriate detail
- A small spatial index

---

## Editor UI & Tooling

### Viewport

- 3D world view (same renderer as sim)
- Optional 2D minimap
- Tile grid + LOD overlay
- Data inspector tooltip:
- Depth
- Clearance
- Zone membership
- Nearest nav aid

### Layer Panel

- Visibility toggle
- Locking
- Opacity
- Type filtering
- Validation status indicators

### Tool System (Mode-Based)

#### Common Tools

- Select / multi-select / lasso
- Move / rotate / scale
- Duplicate / array
- Measure distance, bearing, area
- Snapping configuration

#### Geometry Authoring

- Point tool
- Polyline tool
- Polygon tool
- Volume tool (3D)

#### Painting

- Biome brush
- No-decoration mask brush
- Density brush
- Prop stamping

#### Procedural Helpers

- Scatter along coastline
- Scatter within polygon
- Place along polyline at interval
- Generate dock edges from quay lines

### Property Inspector

Typed UI per feature type:

- Buoy: IALA region, light pattern
- Bridge: clearance envelope
- Cable: min clearance or sag params
- Port: services, rules, metadata

---

## Layer Types

### Decor & Atmosphere

- BiomePaintLayer
- VegetationScatterLayer
- ClutterLayer
- NoDecorationMaskLayer

Masks define **where and how much** content is allowed.

### Structures & Clearance

- BridgeLayer
- OverheadLineLayer
- VerticalObstacleLayer
- ClearanceZoneLayer

Clearance data is queryable at runtime.

### Ports & Infrastructure

- PortLayer
- BerthLayer
- DockLayer
- MooringLayer
- AnchorageLayer
- PortServiceLayer

Fenders are contact/impact elements on docks.

### Navigation Aids & Constraints

- NavAidLayer
- SpeedZoneLayer
- RestrictedZoneLayer
- DepthConstraintLayer
- TrafficSeparationLayer (future)

Constraints are rule-enforcing zones.

---

## Validation & Simulation Preview

### Validation

- Runs live and on submit
- Examples:
- Invalid buoy configuration
- Berth outside port
- Clearance intersecting terrain
- Conflicting speed zones
- Depth violations

### Fix Suggestions

- Snap to safe depth
- Extend zones
- Align with dock edges

### Simulation Preview

- Spawn test vessel
- Route probing
- Clearance checks
- Rule compliance overlays

---

## Data Model & Storage

### Authoring Format

- `project.json`
- `layers/<layer-id>.geojson`
- `layers/<layer-id>.mask.tiff`
- `assets/`
- `build/`

### Database (Prisma-style)

- Pack
- PackMember
- PackVersion
- Layer
- Feature
- RasterChunk
- BuildArtifact

### Storage

- Postgres for metadata + vectors
- Object storage for blobs
- CDN for published artifacts

---

## Streaming & Runtime Integration

At runtime:

- Determine visible tiles
- Load terrain/bathy
- Load overlay chunks
- Merge layers deterministically

Runtime and editor share the same loading logic.

---

## Compilation Pipeline

Two compilation modes:

1. **Preview Compilation**

- Client-side or worker-based
- Fast iteration

1. **Final Compilation**

- Server-side only
- Required for publishing
- Authoritative

---

## Collaboration Model

### MVP

- Presence
- Soft feature locks
- Patch-based updates
- Last-write-wins with warnings

### Future

- Operation logs
- Replay
- CRDT-based merging (optional)

---

## Review & Publishing Workflow

1. Draft editing
2. Submit → immutable snapshot
3. Validation + server compile
4. Reviewer diff & preview
5. Approve or request changes
6. Publish or promote to global

Published versions are immutable.

---

## Modding & Community Content

Users can:

- Create packs
- Collaborate
- Submit for review
- Export/import data (optional)

They cannot:

- Execute code
- Bypass validation
- Inject runtime logic

All shared content is server-authoritative data.

---

## Moderation & Safety

- Submission rate limits
- Automated checks (names, bounds)
- Reviewer audit trail
- Version history retention

---

## Asset Creation & Usage

Assets are:

- Referenced, not embedded
- Instanced procedurally where possible
- Versioned independently

Editor does not replace a DCC tool.

---

## Build-Out Phases

### Phase 1: Nav & Zones

### Phase 2: Ports

### Phase 3: Clearance

### Phase 4: Decor Painting

### Phase 5: Procedural Tools

---

## Glossary of Concepts

- **Layer**: Typed overlay category
- **Feature**: Atomic authored object
- **Work Area**: Bounded editing region
- **Pack**: Unit of authorship
- **Compiled Artifact**: Runtime-ready tile chunk
- **Zone Membership**: Whether a point lies inside a rule zone
- **CRDT**: Conflict-free replicated data type

---

**End of document.**
