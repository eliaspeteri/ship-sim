# Inspector Panel

## Purpose

Shows properties for the current selection or active layer and allows editing.

## Scope

- Selection summary
- Property forms based on schema
- Validation errors and warnings
- Read-only state for locked layers

## Out of Scope

- Geometry editing
- Tool activation

## Implementation Checklist

- [ ] Display active layer + selected features
- [ ] Render fields from schema definition
- [ ] Show validation errors inline
- [ ] Disable edits when layer locked
- [ ] Persist changes to draft state
