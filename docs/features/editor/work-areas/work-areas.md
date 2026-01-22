# Work Areas & Tile Scoping

## Purpose

Define geographic bounds that constrain editing and compilation.

## Scope

- Work area geometry
- Tile sources binding
- Out-of-bounds warnings
- Compile scope restriction

## Out of Scope

- Runtime boundaries

## Implementation Checklist

- [x] Work area definition UI
- [ ] Bounds visualization
- [x] Out-of-bounds warnings
- [ ] Tile prefetch hints
- [ ] Compilation clamps

---

## Implementation Breakdown

### Data model

- [ ] Store work area geometry per pack version
- [ ] Support bbox and polygon types
- [x] Store allowed zoom levels and sources

### Editor UI

- [x] Work area create/edit form
- [ ] Viewport outline overlay
- [ ] Toggle visibility in UI

### Runtime behavior

- [ ] Warn on edits outside work area
- [ ] Clamp compilation to intersecting tiles
- [ ] Use work areas for tile prefetch hints

## Acceptance Criteria

- Pack versions cannot be published without a work area
- Out-of-bounds edits are visibly warned in the editor
- Compilation outputs only for tiles inside work areas
