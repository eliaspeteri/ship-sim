# Editor UI Layout

## Purpose

Defines the editor UI regions, their responsibilities, and how overlays stack inside the editor viewport.

## Scope

- Layout regions (viewport, panels, bottom bar)
- Overlay positioning and spacing
- Z-order and interaction rules
- Responsive behavior

## Out of Scope

- Tool logic
- Rendering implementation
- Data model

## Regions

- Viewport: primary interaction surface, always centered
- Left panel: tools and shortcuts
- Right panel: inspector and layers
- Bottom bar: status + pack actions

## Overlay Rules

- Panels overlay the viewport (not separate columns)
- Panels respect bottom bar height and spacing
- Panels can collapse to icon rail
- Bottom bar stays within editor bounds

## Responsive Behavior

- Panels shrink width below 1100px
- Collapsed panels remain usable
- Bottom bar keeps actions visible

## Implementation Checklist

- [ ] Viewport fills editor root area
- [ ] Overlay panels anchor to top corners
- [ ] Bottom bar anchors to editor bottom
- [ ] Panels leave clear space above bottom bar
- [ ] Z-index order: viewport < panels < bottom bar
- [ ] Mobile breakpoint rules documented
