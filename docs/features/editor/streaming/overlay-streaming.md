# Tile Streaming & Overlay Loader

## Purpose

Stream overlay data aligned to runtime terrain tiles.

## Scope

- Tile visibility
- Overlay chunk loading
- LOD selection
- Cache/eviction
- Editor/runtime parity

## Out of Scope

- Authoring tools

## Implementation Checklist

- [x] Tile visibility evaluator
- [x] Overlay chunk loader
- [x] LOD policy
- [x] Cache eviction rules
- [ ] Shared loader for editor + runtime

---

## Implementation Breakdown

### Tile visibility

- [x] Determine visible tiles for current camera
- [ ] Apply min/max zoom bounds per layer
- [ ] Track in-flight tile requests

### Loader behavior

- [x] Fetch overlay chunks by tile + layer
- [ ] Merge with runtime terrain tiles
- [x] Apply LOD selection rules

### Cache + lifecycle

- [x] Cache tiles by key and LOD
- [ ] Evict tiles outside view + budget
- [x] Clear cache on pack version change

## Acceptance Criteria

- Overlay tiles load in both editor and runtime using the same API
- LOD changes do not cause visual popping beyond expected bounds
- Cache respects memory budget and evicts off-screen tiles
