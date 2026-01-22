# Physics Architecture (Multi-Model)

## Goals

- Support multiple vessel types with model-specific physics while keeping a consistent API surface for the frontend.
- Make vessel physics fully data-driven so new models/params can be added without rebuilding the frontend.
- Keep simulation performant and deterministic in AssemblyScript/WASM.

## Why multiple models

A single "universal" model cannot represent displacement hulls, planing craft, sailing, or tow/assist behavior with realistic responses. The hydrodynamic assumptions differ by regime:

- Displacement hulls are dominated by hydrostatic restoring forces and hull derivatives in surge/sway/yaw.
- Planing craft require lift-based models and speed-dependent wetted area.
- Sailing requires aero forces and leeway dynamics.
- Tow/assist behavior depends on external forces and towline constraints.
- Ice/shallow water introduces environment-modifiers that alter resistance and control authority.

This architecture supports model selection per vessel and shared environment modifiers.

## Model families (initial)

- `displacement`: MMG-style or simplified 3-DOF maneuvering with hull derivatives, added mass, prop/rudder interaction.
- `planing`: lift/drag based on speed and trim; higher control authority at speed.
- `sailing`: combines aero sail forces with hydrodynamic keel/foils; leeway and heel.
- `tow_assist`: adds towline forces and constrained motion.
- `environment_modifiers`: shallow water, squat, ice drag, bank effects.

## High-level data flow

1. Server stores vessel configs (model + params) in DB.
2. Server sends vessel config to frontend (JSON payload).
3. Frontend passes config to WASM via a stable `setVesselParams` call.
4. WASM selects model implementation and advances physics with shared environment inputs.

## Proposed AssemblyScript API updates

Current API is tuned around `createVessel(...)` positional arguments. For multi-model support, we need a data-driven config entry point so the frontend can send arbitrary model params without a breaking flood of positional args.

### New API (proposed)

- `createVessel(x, y, z, psi, roll, pitch, u, v, w, r, p, q): usize`
  - Keep for initial state. Remove physics params from positional arguments.
- `setVesselParams(vesselPtr: usize, modelId: i32, paramsPtr: usize, paramsLen: i32): void`
  - `modelId` selects physics model.
  - `paramsPtr/paramsLen` points to a packed float array (or JSON bytes if we choose that encoding), enabling forward-compatible param sets.
- `getVesselParamsBufferPtr(): usize` / `getVesselParamsBufferCapacity(): i32`
  - Provides a reusable buffer for the frontend to write packed params into WASM memory.
- `setEnvironment(envPtr: usize, envLen: i32): void`
  - Environment inputs (wind/current/wave/ice/shallow water) provided separately.
- `getEnvironmentBufferPtr(): usize` / `getEnvironmentBufferCapacity(): i32`
  - Provides a reusable buffer for environment params.

### Why this change is needed

- The current `createVessel` signature hard-codes a specific physics model and a fixed parameter list.
- Multi-model support requires variable parameter sets, which are not feasible with positional args without constant breaking changes.
- A packed-array or JSON-based param payload allows the frontend to remain loosely coupled while WASM chooses how to interpret by `modelId`.

## Frontend wiring (contract awareness)

- Frontend receives a vessel config from the server:
  - `modelId` or `modelKey` (string), plus params object.
- Frontend serializes params into the expected WASM format:
  - Option A: ordered float array (fastest, deterministic).
  - Option B: JSON string (more flexible, slower; may require parsing in WASM).
- Frontend calls `setVesselParams(...)` and `setEnvironment(...)` whenever config or environment changes.

## Param schema versioning

Each model will have a versioned param schema:

- `modelId` + `schemaVersion` stored in config.
- WASM can validate version and fall back to defaults if fields are missing.

## Model parameter examples (displacement)

- Geometry: `length`, `beam`, `draft`, `blockCoefficient`, `displacement`
- Mass/inertia: `mass`, `izz`, `addedMassX`, `addedMassY`, `addedMassYaw`
- Drag: `cdSurge`, `cdSway`, `cdYaw`
- Hull derivatives: `Yv`, `Yr`, `Nv`, `Nr`
- Rudder: `rudderArea`, `rudderArm`, `rudderLiftSlope`, `rudderStallAngle`, `rudderRateLimit`
- Propulsion: `maxThrust`, `thrustCurve`, `propWashFactor`, `engineTimeConstant`
- Stability: `gmRoll`, `gmPitch`, `rollDamping`, `pitchDamping`
- Hydrodynamic derivatives: `Yv`, `Yr`, `Nv`, `Nr`
- Added mass/inertia: `addedMassX`, `addedMassY`, `addedMassYaw`
- Drag coefficients: `cdSurge`, `cdSway`, `cdYaw`
- Shallow water: `shallowWaterFactor`, `shallowWaterYawFactor`, `shallowWaterRudderFactor`

## Environment modifiers

Modifiers are separate from vessel params so they can be applied globally:

- `shallowWater`: depth, underKeelClearance
- `ice`: dragMultiplier, maxSpeedLimit
- `wind`: speed, direction, airDensity, windageArea
- `current`: speed, direction
- `waves`: height, length, direction, steepness

## Implementation plan (incremental)

1. Add new API surface (`setVesselParams`, `setEnvironment`). Keep existing API as legacy.
2. Introduce `modelId` routing and a `VesselParams` struct for displacement model.
3. Add parameter parsing/validation with defaults for missing fields.
4. Update WASM bridge to serialize params and pass buffers.
5. Update frontend to load configs (JSON now, DB later).
6. Add additional models over time.

## JSON now vs DB later

- JSON now is reasonable for iteration and testing. It keeps the pipeline simple while the model APIs settle.
- DB-backed configs can be introduced once the param schema is stable. The frontend flow stays identical; only the source of configs changes.

## Risks / open questions

- Should params be a float array for speed or JSON for flexibility? We can support both with a small parser.
- How do we manage schema evolution for existing vessel configs?
- Do we need per-model unit tests with regression baselines?
