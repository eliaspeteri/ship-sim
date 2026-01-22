# Editor Viewport

## Purpose

Defines the rendering surface for the map editor and the UI overlays that live inside it.

## Scope

- Renderer mount point
- Camera initialization and controls
- Editor-only overlays (grid, bounds, selection)
- Viewport sizing and resize handling

## Out of Scope

- Tool behavior
- Data compilation
- Collaboration

## Core Behaviors

- Mount renderer in editor configuration
- Keep viewport full-size in editor root
- Provide debug overlays (grid, bounds, tile edges)
- Sync camera state with editor context

## Implementation Checklist

- [x] Renderer mount node in editor viewport
- [x] Editor camera (free/orbit + speed control)
- [ ] Resize observer updates render targets
- [ ] Toggleable overlays (grid, selection, bounds)
- [ ] Viewport click/pick pipeline for tools
