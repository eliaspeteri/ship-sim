# Compilation Pipeline

## Purpose

Compile draft overlay data into tile-aligned artifacts for runtime streaming.

## Scope

- Tile indexing and LOD
- Compilation triggers
- Output artifact structure
- Preview vs server compilation
- Artifact versioning

## Out of Scope

- Rendering implementation
- Review workflow

## Implementation Checklist

- [ ] Define tile key scheme
- [ ] Define per-layer compile strategy
- [ ] Build artifacts by tile + layer
- [ ] Store compiled outputs by version
- [ ] Preview compile in editor
- [ ] Server compile on publish
- [ ] Hook into publish pipeline

---

## Implementation Breakdown

### Source -> artifacts

- [ ] Tile alignment for all geometry
- [ ] LOD simplification per layer type
- [ ] Deterministic ordering for outputs

### Preview compile

- [ ] Client-side compile for draft preview
- [ ] Toggle preview vs last server compile

### Server compile

- [ ] Compile job on publish
- [ ] Store artifacts by pack version
- [ ] Invalidate old artifacts on new publish

## Acceptance Criteria

- Editor can preview compiled overlays without publishing
- Published packs have immutable compiled outputs
- Runtime loads compiled artifacts without editor-only assumptions
