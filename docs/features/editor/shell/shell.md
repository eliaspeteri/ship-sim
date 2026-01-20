# Editor Shell

## Purpose

The **Editor Shell** defines how the map editor exists inside the ship-sim application.

It provides:

- A dedicated editor execution context
- A shared or replicated renderer configuration
- Authentication and authorization gating
- The top-level editor UI layout
- Lifecycle management for loading and unloading editor state

The Editor Shell is the **foundation layer** on which all editor features are built.

---

## What the Editor Shell Is

- A **dedicated editor page and execution context**
- A **host for the 3D renderer** configured for editing
- A **layout container** for editor UI components
- A **permission gate** for editor access
- The **root integration point** for map packs and overlays

---

## What the Editor Shell Is Not

- A gameplay or runtime mode
- A tool implementation
- A layer or feature system
- A simulation controller
- A replacement for the main simulator

The editor does not coexist with runtime gameplay; it runs in its own page.

---

## Routing & Entry Points

### Editor Routes

The editor lives entirely under editor-scoped routes:

- `/editor/packs`
- `/editor/packs/[packId]`
- `/editor/review`

The **main editor workspace** is mounted at:

/editor/packs/[packId]

This route initializes:

- Editor context
- Renderer in editor configuration
- Editor UI layout
- Pack metadata loading

---

## Authentication & Authorization

### Access Requirements

To access any editor route:

- User must be authenticated
- User must have at least the `player` site role

Unauthorized users are:

- Redirected to login or access-denied
- Never shown partial editor UI

### Responsibility Split

The Editor Shell enforces:

- Platform-level access (can the user use the editor?)
- Pack-level access (can the user view this pack?)

Fine-grained permissions (edit vs view, submit, review) are handled by downstream systems.

### Enforcement

- **Server-side** route protection is authoritative
- **Client-side** UI gating prevents confusing states

---

## Editor Execution Context

### Dedicated Editor Context

The editor runs in its **own execution context**, separate from gameplay.

Characteristics:

- No player entity
- No runtime UI
- No player input bindings
- No simulation progression

This context exists solely to support authoring and inspection.

---

## Camera & Navigation

### Editor Camera

The Editor Shell initializes a **free/spectator-style camera**:

- Free orbit and pan
- WASD / arrow-key movement
- Mouse-based rotation
- Adjustable movement speed
- Optional snapping or alignment helpers

The camera behaves similarly to a spectator or debug camera in the sim, but is editor-owned and isolated from gameplay logic.

---

## Simulation State

- Gameplay simulation time is **paused**
- No physics stepping for vessels
- No player-controlled entities

Visual-only animation (e.g. animated props, water shaders) may advance using a render-time delta, but this is an implementation detail and not part of the editor’s semantic model.

---

## Renderer Integration

### Shared or Replicated Renderer

The Editor Shell uses:

- The same rendering architecture as the simulator
- The same terrain and bathymetry pipelines
- The same LOD and streaming behavior

This ensures **WYSIWYG parity** between editor and runtime.

Whether the renderer is:

- Literally the same instance
- Or a separately initialized instance with shared configuration

…is an implementation detail. The contract is visual equivalence.

### Editor-Specific Render Layers

The shell enables editor-only visual layers:

- Feature outlines
- Selection highlights
- Tile boundaries
- Debug overlays (depth, clearance, zones)

These:

- Exist only in editor routes
- Never ship to runtime builds
- Can be toggled per editor feature

---

## Layout & UI Composition

### High-Level Layout

The Editor Shell defines the structural layout:

+--------------------------------------------------+
| Top Bar (pack info, actions, status) |
+----------------------+---------------------------+
| Tool Sidebar | |
| (left) | 3D Viewport |
| | |
+----------------------+---------------------------+
| Bottom Panel / Logs / Status (optional) |
+--------------------------------------------------+
| Inspector Panel (right) |
+--------------------------------------------------+

The shell owns the layout regions, but **does not dictate their contents**.

---

## Shell-Owned UI Responsibilities

The Editor Shell owns:

- Top-level layout
- Navigation between editor pages
- Pack context display
- Global editor status indicators:
  - loading
  - saving
  - compiling
  - blocking errors

The shell does **not** own:

- Tool buttons
- Layer lists
- Feature inspectors
- Domain-specific UI

Those are injected by other subsystems.

---

## State Ownership

### Shell-Owned State

The Editor Shell owns:

- Active pack ID
- Editor lifecycle state (loading, ready, blocked)
- Global editor preferences (e.g. grid visibility)
- User’s pack access level

This state is long-lived and cross-cutting.

### Delegated State

The shell explicitly does **not** own:

- Tool state
- Selection state
- Layer visibility
- Geometry editing state
- Validation results

Those belong to their respective feature modules.

---

## Lifecycle & Initialization

### Entry Sequence

When navigating to `/editor/packs/[packId]`:

1. Authenticate user
2. Verify pack access
3. Load pack metadata
4. Initialize editor execution context
5. Initialize renderer in editor configuration
6. Mount editor layout
7. Hand off to pack/layer loading systems

The Editor Shell:

- Prepares the environment
- Does not load tiles, features, or layers itself

---

## Error Handling & Blocking States

The shell handles **hard blocking conditions**:

- Unauthorized access
- Pack not found
- Access revoked
- Editor disabled (maintenance)

Behavior:

- Full-page error or redirect
- No partial editor UI mounting

Non-blocking issues (validation errors, compile failures, conflicts) are handled elsewhere.

---

## Performance Responsibilities

The Editor Shell ensures:

- Editor code is code-split from runtime
- Editor bundles are only loaded on editor routes
- Runtime performance is unaffected by editor features

---

## Extension Points

The shell exposes stable extension points for:

- Registering editor panels
- Registering editor overlays
- Registering global editor shortcuts
- Registering editor-only render passes

All editor subsystems integrate **into** the shell, never the other way around.

---

## Explicit Non-Goals

The Editor Shell does not:

- Interpret map data
- Modify simulation state
- Implement tools
- Validate domain rules
- Compile overlays
- Handle collaboration or review logic

---

## Dependencies

Depends on:

- Authentication system
- Routing
- Renderer configuration
- Map pack metadata API

Depended on by:

- Layer system
- Tools
- Validation engine
- Collaboration
- Review & publishing workflows

---

## Success Criteria

The Editor Shell is complete when:

- The editor runs as a fully isolated authoring environment
- Renderer output matches runtime visuals
- Unauthorized users cannot access editor routes
- Editor UI and runtime UI never mix
- All editor features can be developed independently on top of it

---

**End of document.**
