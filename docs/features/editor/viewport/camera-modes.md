# Editor Camera Modes

## Purpose

Provide camera modes tailored to different authoring workflows.

## Scope

- 2D top-down mode
- 2.5D tilted mode
- Free 3D (first-person/spectator)
- Mode switching + persistence

## Out of Scope

- Tool logic
- Rendering pipeline

## Modes

### 2D (Top-Down)

- Orthographic or high-FOV perspective
- Locked pitch (90°)
- Pan + zoom only

### 2.5D (Tilted)

- Perspective camera
- Fixed pitch (e.g. 45°)
- Pan + orbit + zoom

### Free 3D

- Full pitch/yaw
- WASD + mouse look
- Optional fly speed controls

## Implementation Checklist

- [ ] Mode selector in editor UI
- [ ] Per-mode camera config
- [ ] Input bindings per mode
- [ ] Persist last mode per user
- [ ] Smooth transition between modes
