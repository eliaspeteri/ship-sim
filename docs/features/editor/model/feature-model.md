# Feature & Geometry Model

## Purpose

Define the atomic objects authored inside layers.

## Scope

- Feature identity and UUID rules
- Geometry types (point/line/polygon/volume/raster)
- Property typing
- Feature diffs
- Validation hooks

## Out of Scope

- UI tools
- Rendering styles

## Implementation Checklist

- [ ] Feature schema per layer type
- [ ] Stable feature IDs in drafts
- [ ] Geometry constraints per type
- [ ] Diff format for review
- [ ] Hook validation for properties + geometry
