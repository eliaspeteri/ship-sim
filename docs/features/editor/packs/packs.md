# Map Packs

## Purpose

A **Map Pack** is the primary unit of authorship, collaboration, versioning, and distribution in the map editor.

It represents a **cohesive collection of overlay data** (layers, features, assets references, and metadata) authored for a specific geographic scope and purpose, such as:

- A port or harbor
- A river section
- A coastal approach channel
- A set of navigation aids
- Infrastructure or clearance data for an area

Map Packs are designed to:

- Be authored collaboratively
- Be versioned and immutable once published
- Be streamed efficiently at runtime
- Be safely shared in an online environment
- Support both community content and curated global content

---

## What a Map Pack Is

A Map Pack is:

- A **container** for layers and features
- A **scope boundary** for editing and compilation
- A **unit of collaboration and permissions**
- A **unit of publishing and versioning**
- A **runtime-loadable overlay source**

---

## What a Map Pack Is Not

A Map Pack is not:

- A terrain or bathymetry dataset
- A runtime script or executable mod
- A save file for simulation state
- A free-form global edit without bounds
- A guarantee of inclusion in the global world

All Map Pack content is **overlay-only and data-driven**.

---

## Pack Identity & Metadata

Each Map Pack has stable identity and descriptive metadata.

### Required Fields

- `id` – globally unique identifier
- `name` – human-readable name
- `description` – intent and scope
- `ownerId` – pack owner
- `createdAt`
- `updatedAt`

### Optional Fields

- `tags` (e.g. `port`, `river`, `nav-aids`)
- `regionSummary` (human-readable area description)
- `thumbnail` (optional preview image)

Metadata is used for discovery, review, and UI presentation — not runtime logic.

---

## Work Areas

### Definition

A **Work Area** defines the geographic and technical scope of a Map Pack.

A work area specifies:

- Geographic bounds (bounding box or polygon)
- Tile sources (terrain, bathymetry, imagery)
- Allowed zoom levels

A pack may define **one or multiple work areas**, but all authored content must fall within at least one work area.

---

### Purpose of Work Areas

Work Areas exist to:

- Prevent accidental unbounded edits
- Define compilation and streaming scope
- Optimize tile loading and caching
- Communicate author intent clearly
- Provide context during review

They are **not gameplay boundaries**, but authoring and packaging boundaries.

---

### Editor & Compiler Behavior

- Editing outside a work area triggers warnings
- Compilation is restricted to tiles intersecting work areas
- Tile prefetching uses work areas as hints
- Review tooling uses work areas to contextualize changes

---

## Visibility Levels

Each **pack version** has exactly one visibility state.

### 1. Private Draft

- Default state
- Accessible only to pack members
- Fully editable
- Not discoverable by others

### 2. Published Public

- Discoverable in the community map list
- Loadable in private or custom spaces
- Immutable once published
- Does **not** require human review by default
- Subject to automated validation and moderation

### 3. Global Curated

- Reviewed and approved by admins
- Included in the default global overlay set
- Distributed automatically to all players
- Immutable
- Higher quality and consistency requirements

Visibility applies to **versions**, not the pack as a whole.

---

## Roles & Permissions

### Two-Level Role Model

Map Packs use two distinct role systems.

#### Site Roles (platform-wide)

- `player`
- `reviewer`
- `admin`

#### Pack Roles (per-pack)

- `owner`
- `editor`
- `viewer`

---

### Pack Role Capabilities

| Capability           | Owner | Editor | Viewer |
| -------------------- | ----- | ------ | ------ |
| View pack            | ✅    | ✅     | ✅     |
| Edit features        | ✅    | ✅     | ❌     |
| Manage layers        | ✅    | ✅     | ❌     |
| Manage collaborators | ✅    | ❌     | ❌     |
| Submit for review    | ✅    | ✅     | ❌     |

Site roles apply on top (e.g. only admins can promote to global curated).

---

## Versioning Model

### Pack Versions

All changes occur within a **Pack Version**.

A version is a snapshot of:

- Work areas
- Layers
- Features
- Asset references
- Configuration

---

### Version States

- `draft` – mutable
- `submitted` – frozen, under review
- `published` – immutable

Once a version is published, it can never be modified.

---

## Implementation Checklist

- [ ] Pack CRUD
- [ ] Version creation on edit
- [ ] Role assignment (owner/editor/viewer)
- [ ] Visibility controls
- [ ] Work area association

---

## Implementation Breakdown

### API + storage

- [ ] Pack table with metadata fields
- [ ] Pack version table (draft/submitted/published)
- [ ] Pack roles table (owner/editor/viewer)
- [ ] Work area linkage to versions

### UI

- [ ] Pack list view (filters, tags, updatedAt)
- [ ] Pack create flow (name, description, region)
- [ ] Pack settings panel (roles, visibility)
- [ ] Pack workspace entry point

### Lifecycle

- [ ] Draft creation on first edit
- [ ] Submit for review
- [ ] Publish / promote to global curated

## Acceptance Criteria

- Users can create a pack and open a draft workspace
- Roles gate edit and submit capabilities
- Pack visibility states enforce discoverability rules

---

### Immutability Rationale

Immutability ensures:

- Reproducibility
- Safe caching and CDN distribution
- Stable references from spaces
- Auditable review history

Any update requires creating a **new version**.

---

## Publishing & Review Policy

### Community Publishing (Published Public)

- Requires:
  - Schema validation
  - Technical validation
  - Automated moderation checks
- Does **not** require mandatory human review
- Subject to reporting and takedown

This keeps community publishing scalable.

---

### Global Curation (Global Curated)

- Requires explicit submission as a global candidate
- Requires human review
- Subject to stricter quality and conflict rules
- May replace or deprecate existing global content

Global curation is intentionally selective.

---

## Pack Lifecycle

1. Create draft version
2. Collaborative editing
3. Submit for review (optional)
4. Review outcome:
   - Approved → published
   - Changes requested → new draft
5. Optional promotion to global curated

Published versions are immutable.

---

## Enabling Packs in Spaces

### What “Enabling a Pack” Means

Enabling a pack means:

- Referencing a specific **pack version** in a space’s configuration
- Assigning it a **priority/precedence**
- Optionally pinning it to that version

Pack data is **not downloaded wholesale**.

---

### Runtime Loading Model

- Compiled overlay chunks are streamed **on demand**
- Loading is tile-based and LOD-aware
- Only tiles intersecting:
  - visible area
  - enabled packs’ work areas
    are fetched

Caching is handled via HTTP/CDN and optional client-side storage.

---

## Version Pinning in Spaces

Spaces may:

- **Pin** a pack to a specific version (default for stability)
- **Follow latest** (auto-update)

Recommended defaults:

- Community packs → pinned
- Global curated packs → latest

This prevents spaces from breaking due to upstream updates.

---

## Overlaps, Conflicts & Precedence

Multiple packs may cover the same tiles.

### Precedence Order (Highest → Lowest)

1. Space-specific or user-enabled packs
2. Community packs enabled in the space
3. Global curated overlays

Higher-precedence packs override lower-precedence ones.

---

### Conflict Handling Strategies

Different layer types resolve conflicts differently:

- **Decor layers**: blend or mask
- **Rule zones**: higher-precedence overrides lower
- **Discrete objects**: allow duplicates, warn on proximity
- **Ports**: overlapping boundaries trigger warnings or rejection in global review

---

### Where Conflicts Are Handled

- **Runtime**: deterministic precedence
- **Editor / Space config UI**: detection + warnings
- **Global review**: stricter enforcement, possible rejection

---

## Import & Export (Optional)

Map Packs may optionally support:

- Export to portable data formats
- Import from validated external sources (e.g. GeoJSON)

Imported content:

- Is validated against schemas
- Enters as a draft version
- Never bypasses server authority

---

## Moderation & Safety

- Automated checks (names, bounds, size limits)
- Rate limits on submissions
- Reporting and takedown mechanisms
- Reviewer/admin audit trails

Global curated content may be deprecated but not silently removed.

---

## Dependencies

Depends on:

- Editor Shell
- Authentication & roles
- Database & storage
- Compilation pipeline

Depended on by:

- Layer system
- Runtime overlay loader
- Collaboration
- Review & publishing
- Space configuration

---

## Success Criteria

The Map Pack system is complete when:

- Content can be safely authored and shared
- Versions are stable and reproducible
- Spaces do not break due to upstream changes
- Global content is curated without blocking community creativity
- Runtime loading remains performant and predictable

---

**End of document.**
