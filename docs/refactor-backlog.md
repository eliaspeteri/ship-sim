# Refactor Backlog: God Components and Brittle Tests

## Scope

This backlog now covers the primary cross-cutting risks in the codebase:

1. God components/modules (high coupling, mixed responsibilities, large files).
2. Brittle tests (internals-coupled, heavy mocks, `any`-driven access to private state).
3. Derivation/reactivity drift and duplicated control paths.
4. UI styling-system inconsistency (CSS Modules + Tailwind overlap).
5. Type-safety gaps (incomplete compiler coverage, unsafe casts/assertions).
6. Security boundary weaknesses (authorization gaps, unauthenticated mutation paths, weak runtime guardrails).
7. Runtime performance hotspots (high-frequency polling/state churn and concentrated tick work).
8. Reliability gaps (unguarded upstream failures, timer lifecycle issues, blocking request-path operations).
9. Data consistency drift (parallel in-memory/runtime/DB state authority).
10. Developer experience/tooling drift (docs-command mismatch, unstable test harness, missing CI guardrails).

The goal is incremental, low-risk refactors in PR-sized steps, with each item mapped to explicit acceptance criteria.

## Hotspots Identified

### God Components / Modules

- `src/components/HudDrawer.tsx` (1359 lines)
- `src/pages/sim.tsx` (1000 lines)
- `src/components/Scene.tsx` (1291 lines)
- `src/components/radio/MarineRadio.tsx` (1298 lines)
- `src/components/radar/RadarDisplay.tsx` (1000 lines)
- `src/components/hud/HudPanels.tsx` (1273 lines, many exports in one module)
- `src/pages/admin.tsx` (808 lines)
- `src/pages/spaces.tsx` (813 lines)
- `src/networking/socket.ts` (1296 lines)
- `src/store/index.ts` (1064 lines)
- `src/simulation/simulationLoop.ts` (751 lines)
- `src/server/api.ts` (2875 lines)
- `src/server/index.ts` (2701 lines)
- `src/server/economy.ts` (775 lines)
- `assembly/index.ts` (1075 lines)

### Brittle Tests

- `tests/frontend/server/api.test.ts` (direct `router.stack` introspection and manual handler execution)
- `tests/frontend/server/index.test.ts` (very high mock fan-out and implementation-coupled setup)
- `tests/frontend/simulationLoop.test.ts` (`(loop as any)` and direct internal method calls)
- `tests/frontend/components/HudDrawer.test.tsx` (broad child replacement/mocking)
- `tests/frontend/SimPage.test.tsx` (broad page-level dependency mocking)
- `tests/frontend/components/hud/HudPanels.test.tsx` (heavy dependency mocking and `as any` fixtures)
- `tests/frontend/socketManager.test.ts` (large mock-heavy suite with untyped store fixture and socket internals coupling)
- `assembly/core.test.ts` (monolithic physics suite with duplicated constructor/param internals)

### Additional Smell Patterns (Second Pass)

- Duplicated vessel/target derivation logic:
  - `src/components/HudDrawer.tsx` (radar, AIS, admin target loops over `otherVessels`)
  - `src/components/Scene.tsx` (drag target derivation + vessel iteration for render)
  - `src/pages/sim.tsx` (joinable vessel derivation)
- Non-reactive store reads inside render path:
  - `src/components/HudDrawer.tsx` (`useStore.getState()` in JSX prop wiring)
  - Note: other `useStore.getState()` usages were found in effects/handlers (`src/pages/sim.tsx`, `src/pages/physics-debug.tsx`) and are less severe than render-path reads.
- Control side effects likely over-firing or duplicated:
  - `src/components/HudDrawer.tsx` (control apply/send in effect on local control changes)
  - `src/pages/sim.tsx` (keyboard handler also applies/sends controls)
  - `src/components/radar/RadarDisplay.tsx` (`setSweepAngle` each animation frame)
  - `src/components/Scene.tsx` (HUD offset polling every 500ms)
- UI/style and typing smells:
  - Inline-style-heavy UI with hardcoded visual constants:
    - `src/components/navigation/ecdis/EcdisSidebar.tsx`
    - `src/components/radio/MarineRadio.tsx`
    - `src/components/bridge/ConningDisplay.tsx`
  - Test typing looseness (`any`, untyped fixtures, broad mocks) concentrated in:
    - `tests/frontend/components/HudDrawer.test.tsx`
    - `tests/frontend/SimPage.test.tsx`
    - `tests/frontend/components/hud/HudPanels.test.tsx`
    - `tests/frontend/server/api.test.ts`
    - `tests/frontend/server/index.test.ts`
    - `tests/frontend/simulationLoop.test.ts`
- Server architecture and boundary smells:
  - Mixed state sources in API (`prisma` + in-memory `vesselStates`/`environmentState` in `src/server/api.ts`).
  - Auth boundary inconsistency in API route ordering (`src/server/api.ts` has public vessel routes before global auth middleware).
  - Runtime orchestration concentration in `src/server/index.ts` (`socket auth`, `connection`, `broadcast`, persistence, missions, economy, weather in one module).
  - `__test__` surface in `src/server/index.ts` encourages white-box coupling from tests.
- Assembly runtime/test smells:
  - Global singleton vessel/environment state in `assembly/index.ts` (`globalVessel`, `globalEnvironment`) increases hidden test coupling.
  - Large ABI/magic-index mapping in `assembly/index.ts` and duplicated constants in `assembly/core.test.ts`.
  - Highly repetitive constructor/update setup in `assembly/core.test.ts` (many near-identical `createVessel`/`updateVesselState` calls).
  - At least one suspicious argument-order pattern in `assembly/core.test.ts` (`createVessel` invocation around `roll and pitch` test) that can pass accidentally due fallback guards.
- Mixed styling strategy (CSS Modules + Tailwind utility classes):
  - CSS Modules currently used across page/component hotspots (`src/components/HudDrawer.module.css`, `src/pages/SimPage.module.css`, `src/components/Layout.module.css`, etc.) while many newer screens use inline Tailwind utility classes.
  - Same-file mixed approach already appears in:
    - `src/components/hud/HudPanels.tsx` (imports `HudDrawer.module.css` while also using Tailwind utility class strings)
    - `src/features/sim/JoinChoiceModal.tsx` (imports `SimPage.module.css` while also using Tailwind utility class strings)
  - This split increases token drift, duplicate visual definitions, and styling maintenance overhead.
- Client runtime architecture smells (`socket` + store):
  - `src/networking/socket.ts` combines connection lifecycle, auth/session sync, simulation projection, chat history, admin commands, seamarks, and economy/mission events in one singleton.
  - `src/networking/socket.ts` repeatedly reaches into global store state (`useStore.getState()`) across handlers, making dependencies implicit and difficult to test.
  - `src/store/index.ts` is a wide “god store” with mixed domain concerns and very large update branches (`updateVessel` deep merge path).
- Long parameter list / duplicated constructor pipeline:
  - `src/simulation/simulationLoop.ts` repeats near-identical long `createVessel(...)` calls across initialize/teleport/resync paths.
  - `assembly/core.test.ts` repeats large positional `createVessel(...)` setup blocks, increasing argument-order risk.
- Placeholder/dead-code smells:
  - `src/networking/socket.ts` has a no-op stub `updateVesselPosition(...)`.
  - `src/store/index.ts` has an empty `updateWaterStatus(...)` implementation.
  - `src/store/index.ts` day/night interval setup is noted as simplified without explicit teardown path.
- Type-safety boundary smells:
  - `tsconfig.json` includes `**/*.ts` but not `**/*.tsx`, leaving a large part of UI code outside direct `tsc` coverage.
  - There is no dedicated `typecheck` script in `package.json`, so strict typing is not an explicit CI contract.
  - High concentration of non-null assertions around auth context in `src/server/api.ts` (`req.user!` across many handlers).
  - Unsafe cast chains (`unknown as`) in runtime paths (`src/pages/sim.tsx`, `src/lib/wasmLoader.ts`, `src/server/middleware/authentication.ts`, `src/components/HudDrawer.tsx`).
- Security boundary smells:
  - IDOR risk on user settings routes (`src/server/api.ts` settings endpoints read/write arbitrary `:userId` without ownership/admin check).
  - Broad vessel state mutation surface (`src/server/api.ts` vessel update/delete endpoints key by user id and rely on coarse permission checks without strict ownership binding).
  - Editor mutation endpoints are unauthenticated (`src/pages/api/editor/packs/*`, `src/pages/api/editor/compile.ts`), allowing anonymous writes/deletes.
  - Artifact persistence path lacks payload quotas/rate controls (`src/server/editorCompilationStore.ts`).
  - Production CORS/socket origin fallback allows `true` when env allowlist is missing (`src/server/index.ts`), weakening origin hardening with credentials enabled.
  - Private-space password accepted via query parameter (`src/server/api.ts` `/spaces`), which risks leakage in logs/history/referers.
  - Socket cookie parser lacks malformed-cookie guard around `decodeURIComponent` (`src/server/index.ts` `parseCookies`).
  - Credential registration endpoint lacks strong anti-automation controls (`src/pages/api/register.ts`).
- Performance/reliability/data-consistency smells:
  - Regression risk: avoid reintroducing blocking crypto in request paths (L1 migrated auth/register to async bcrypt).
  - Synchronous editor persistence on request-triggered paths (`src/server/editorCompilationStore.ts`, `src/server/editorPacksStore.ts` use sync fs APIs).
  - Tile proxy API calls do not guard upstream network failures/timeouts (`src/pages/api/tiles/terrain/[z]/[x]/[y].ts`, `src/pages/api/tiles/land/[z]/[x]/[y].ts`).
  - Additional polling loops outside original frontend hotspots:
    - `src/features/editor/components/EditorViewport.tsx` (overlay refresh every 400ms).
    - `src/pages/admin.tsx` (socket connectivity poll and periodic metrics poll).
  - Server background intervals are started outside server bootstrap/test guard (`src/server/index.ts` environment event + broadcast intervals).
- Developer experience/tooling smells:
  - Docs-command drift: `README.md` test and runtime instructions have been out of sync with `package.json` scripts.
  - Frontend test harness drift risk (`jest.config.js` + `ts-jest`/Jest major alignment is brittle and has already produced local setup failures).
  - Missing CI workflow guardrails (`lint`/`typecheck`/tests are not enforced in repo automation).
  - Commit hooks only run staged lint/format (`.husky/pre-commit`) and do not gate on typecheck/tests before push.
  - Docker runtime command drift (`docker-compose.yml` references `scripts/create-admin.ts`, but only `scripts/seed-admin.js` exists).
  - Local frontend test loop pays avoidable overhead with always-on coverage in Jest config.

## Prioritization

- `P0`: Highest risk reduction, unblock future work, immediate maintainability benefit.
- `P1`: Important follow-up; improves velocity after P0.
- `P2`: Nice-to-have cleanup and hardening.

## Global Quality Gate (Applies to Every Backlog Item)

Unless a task explicitly states a stricter requirement, each PR implementing any backlog item must satisfy:

1. Lint passes for changed files (and project lint where required by CI).
2. Relevant automated tests pass for the touched area.
3. No reduction in existing critical-path coverage for the touched area.
4. CI status is green before merge.
5. Control-flow nesting stays low in touched code (target max depth `3`, with explicit justification for exceptions).
6. Function/method signatures in touched code use at most `3` parameters by default; use a typed parameter object when more context is required.
7. For changed behavior, tests include happy-path coverage plus at least one sad/failure path and one edge/boundary case.

## Workstream A: Break Up God Components / Modules

Completed: [ ]

### A1. Decompose `HudDrawer` into container + hooks + per-tab adapters (`P0`)

Completed: [x]

Files: `src/components/HudDrawer.tsx`, `src/components/hud/*`

Tasks:

1. Extract selector aggregation into `useHudStoreSnapshot`.
2. Extract side effects into focused hooks:
   - `useHudControlsSync`
   - `useHudMissionData`
   - `useHudFleetData`
3. Extract derived data builders:
   - radar/AIS/admin-target transforms
   - nav stats builder
4. Replace long conditional tab rendering with a tab-to-renderer map.

Acceptance:

1. `HudDrawer.tsx` reduced below 500 lines.
2. Existing `HudDrawer` tests still pass.
3. No user-visible behavior change.

### A2. Split `HudPanels.tsx` into per-panel files (`P0`)

Completed: [x]

Files: `src/components/hud/HudPanels.tsx` -> `src/components/hud/panels/*`

Tasks:

1. Move each exported panel into its own file.
2. Keep a thin `index.ts` export barrel.
3. Move panel-specific types next to panel modules.

Acceptance:

1. No single panel file exceeds 350 lines.
2. Imports in `HudDrawer` become explicit and local to panel files.
3. `tests/frontend/components/hud/HudPanels.test.tsx` passes after import updates.

### A3. Split `SimPage` orchestration (`P0`)

Completed: [x]

Files: `src/pages/sim.tsx`, new hooks under `src/features/sim/hooks/*`

Tasks:

1. Extract space lifecycle logic (`useSpaceSelectionFlow`).
2. Extract session/socket bootstrap (`useSimSessionBootstrap`).
3. Extract mission loading (`useMissionBootstrap`).
4. Extract keyboard controls (`useSimKeyboardControls`).

Acceptance:

1. `sim.tsx` below 450 lines.
2. No direct `sessionStorage`/`localStorage` logic in page render body.
3. Existing `SimPage` tests pass.

### A4. Split `Scene` by concern (`P1`)

Completed: [x]

Files: `src/components/Scene.tsx`, new modules under `src/components/scene/*`

Tasks:

1. Move admin callout and actions into `scene/AdminVesselOverlay`.
2. Move spectator controls into `scene/SpectatorController`.
3. Move environmental/time-of-day lighting logic into `scene/LightingController`.
4. Move drag-handle behavior into `scene/AdminDragLayer`.

Acceptance:

1. `Scene.tsx` below 500 lines.
2. No change in camera/admin interaction behavior.

### A5. Split `RadarDisplay` rendering pipeline (`P1`)

Completed: [ ]

Files: `src/components/radar/RadarDisplay.tsx`, new modules under `src/components/radar/render/*`

Tasks:

1. Separate state/control logic from draw pipeline.
2. Move canvas draw stages into pure functions:
   - background/noise
   - targets/ARPA/AIS
   - overlays (EBL/VRM/guard zone)
3. Replace mutable ref fan-out with a single renderer input model.

Acceptance:

1. `RadarDisplay.tsx` below 450 lines.
2. Draw helpers covered by focused unit tests.

### A6. Split `MarineRadio` UI state machine (`P2`)

Completed: [ ]

Files: `src/components/radio/MarineRadio.tsx`

Tasks:

1. Introduce reducer for radio state transitions.
2. Separate timer/reception effects into hooks.
3. Split view subcomponents (display, keypad, controls).

Acceptance:

1. `MarineRadio.tsx` below 500 lines.
2. Behavior parity for channel switching, distress, and scan mode.

### A7. Split `admin.tsx` and `spaces.tsx` service/hooks (`P2`)

Completed: [ ]

Files: `src/pages/admin.tsx`, `src/pages/spaces.tsx`

Tasks:

1. Extract API operations into feature services.
2. Extract form state and mutation handlers into hooks.
3. Keep pages as composition-only.

Acceptance:

1. Each page below 450 lines.
2. No direct fetch orchestration duplicated in page components.

## Workstream B: Harden Brittle Tests

Completed: [ ]

### B1. Replace route-internals testing in `api.test.ts` (`P0`)

Completed: [x]

Files: `tests/frontend/server/api.test.ts`

Tasks:

1. Remove `router.stack` traversal and manual middleware stepping.
2. Test via request-level harness (HTTP-like integration boundary).
3. Split by route domain:
   - admin/moderation
   - vessels/environment
   - economy
   - spaces/profile/careers

Acceptance:

1. No usage of `router.stack`, `route.stack`, or manual `next` driving.
2. Test failures reflect behavior regressions, not router structure changes.

### B2. Reduce mock fan-out in `server/index.test.ts` (`P0`)

Completed: [x]

Files: `tests/frontend/server/index.test.ts`

Tasks:

1. Replace global mega-mock setup with scenario-specific fixtures.
2. Add shared builders for socket/server fixtures.
3. Keep only boundary mocks required for each test group.

Acceptance:

1. Reduce `jest.mock` count in file by at least 40%.
2. Tests remain green with same behavior coverage intent.

### B3. Eliminate private-state poking in `simulationLoop.test.ts` (`P1`)

Completed: [x]

Files: `tests/frontend/simulationLoop.test.ts`, `src/simulation/simulationLoop.ts`

Tasks:

1. Add test seams for internals currently accessed via `(loop as any)`.
2. Prefer public API assertions over internal field mutation.
3. Keep white-box tests only where no stable public surface exists.

Acceptance:

1. Remove most `(loop as any)` access patterns.
2. Internal refactors in loop should not break unrelated tests.

### B4. Rebalance component tests away from broad child mocking (`P1`)

Completed: [ ]

Files: `tests/frontend/components/HudDrawer.test.tsx`, `tests/frontend/SimPage.test.tsx`, `tests/frontend/components/hud/HudPanels.test.tsx`

Tasks:

1. Keep mocks only for expensive rendering or external IO.
2. Add user-level assertions on visible behavior, not wiring details.
3. Replace `as any` fixtures with typed test builders.

Acceptance:

1. Fewer blanket component mocks in each file.
2. Core flows validated from user-observable UI state.

### B5. Add test guardrails (`P2`)

Completed: [ ]

Files: test lint config and test utilities

Tasks:

1. Add lint rule exceptions policy for `any` in tests.
2. Add helper utilities for typed fixture creation.
3. Document preferred testing pyramid for frontend/server paths.

Acceptance:

1. New tests default to typed fixtures and boundary-level assertions.
2. Existing brittle patterns stop increasing over time.

### B6. Split and type `socketManager` tests (`P1`)

Completed: [ ]

Files: `tests/frontend/socketManager.test.ts`, `src/networking/socket.ts`

Tasks:

1. Split monolithic `socketManager.test.ts` into domain suites (`auth`, `chat`, `simulation`, `admin`).
2. Replace `Record<string, any>` store fixtures with typed builders aligned to store contracts.
3. Reduce module-level `jest.doMock(...)` fan-out by testing a factory-created socket manager with injected dependencies.

Acceptance:

1. No root `Record<string, any>` fixture remains in `socketManager` tests.
2. No single socket manager test file exceeds 400 lines.
3. Test failures map to behavior contracts rather than internal handler wiring.

## Workstream C: Derivation and Reactivity Hygiene

Completed: [ ]

### C1. Consolidate vessel-target derivation and projection utilities (`P0`)

Completed: [x]

Files: `src/components/HudDrawer.tsx`, `src/components/Scene.tsx`, `src/pages/sim.tsx`, new shared helpers under `src/features/sim/selectors/*` (or equivalent)

Tasks:

1. Introduce shared selectors/helpers for:
   - visible/in-space vessels
   - radar/AIS projection-ready vessel snapshots
   - joinable vessel list derivation
2. Replace repeated `Object.entries(otherVessels || {})` transforms with shared utilities.
3. Centralize ship-space filtering defaults (`DEFAULT_SPACE_ID`) in one helper.

Acceptance:

1. No duplicate geospatial target-derivation loops in `HudDrawer`.
2. `Scene` and `sim.tsx` consume shared vessel selectors instead of bespoke transforms.
3. Existing radar/AIS/admin/join behavior remains unchanged.

### C2. Remove render-path `useStore.getState()` reads (`P0`)

Completed: [x]

Files: `src/components/HudDrawer.tsx`

Tasks:

1. Replace render-time `useStore.getState()` props with reactive selectors.
2. Add regression tests ensuring chat panel props update when `spaceId` / `currentVesselId` changes.

Acceptance:

1. No `useStore.getState()` calls in JSX render trees.
2. Store changes propagate via React subscriptions only.

### C3. Unify control update pipeline and add rate control (`P0`)

Completed: [x]

Files: `src/components/HudDrawer.tsx`, `src/pages/sim.tsx`, optional shared hook under `src/features/sim/hooks/*`

Tasks:

1. Define a single authoritative path for control application + socket emission.
2. Remove duplicate apply/send behavior between HUD effect and keyboard flow.
3. Add optional throttling/debouncing for high-frequency control updates.

Acceptance:

1. Exactly one control-send path active in player mode.
2. No duplicate `sendControlUpdate` emissions for a single user action.
3. Existing control responsiveness remains acceptable.

### C4. Reduce high-frequency UI state churn (`P1`)

Completed: [ ]

Files: `src/components/radar/RadarDisplay.tsx`, `src/components/Scene.tsx`, `src/components/LandTiles.tsx`

Tasks:

1. Keep radar sweep animation off React state where possible (canvas-only update loop).
2. Replace polling-based HUD footer offset in `Scene` with observer/event-driven approach.
3. Review interval cadence in `LandTiles` and tune only if needed.

Acceptance:

1. Per-frame React state updates are removed for sweep-only visuals.
2. Polling loops are minimized or replaced with observer-based updates.
3. No visual regressions in radar/scene overlays.

## Workstream D: UI Style and Test Typing Quality

Completed: [ ]

### D1. Migrate inline-style-heavy bridge/nav components to style modules/tokens (`P1`)

Completed: [ ]

Files: `src/components/navigation/ecdis/EcdisSidebar.tsx`, `src/components/radio/MarineRadio.tsx`, `src/components/bridge/ConningDisplay.tsx`

Tasks:

1. Extract repeated inline style objects into CSS modules and theme variables.
2. Separate hardcoded demo values from live data-driven display values.
3. Keep visual parity while improving maintainability.

Acceptance:

1. Significant reduction in inline style blocks in targeted files.
2. Hardcoded operational values (time/speed/etc.) are isolated or removed.
3. Snapshot/visual tests updated as needed.

### D2. Tighten typing in brittle tests (`P1`)

Completed: [ ]

Files:

- `tests/frontend/components/HudDrawer.test.tsx`
- `tests/frontend/SimPage.test.tsx`
- `tests/frontend/components/hud/HudPanels.test.tsx`
- `tests/frontend/server/api.test.ts`
- `tests/frontend/server/index.test.ts`
- `tests/frontend/simulationLoop.test.ts`

Tasks:

1. Replace broad `any` fixtures with typed builders and helper factories.
2. Restrict `as any` to explicitly documented adapter boundaries.
3. Split oversized tests into typed domain-focused suites where practical.

Acceptance:

1. Noticeable reduction in `as any` usage in targeted files.
2. Test intent becomes type-checked and easier to refactor safely.
3. CI remains green with improved static confidence.

## Workstream E: Server Decomposition and Boundary Hardening

Completed: [ ]

### E1. Split `src/server/api.ts` into domain routers + shared error wrapper (`P0`)

Completed: [ ]

Files: `src/server/api.ts`, new modules under `src/server/routes/*`

Tasks:

1. Partition routes by domain (`vessels`, `environment`, `economy`, `spaces`, `careers`, `admin`).
2. Introduce shared async handler wrapper and error responder to remove repetitive `try/catch + res.status(500)` boilerplate.
3. Keep `src/server/api.ts` as a thin router composition layer.

Acceptance:

1. `src/server/api.ts` reduced below 600 lines.
2. No direct `router.stack` assumptions in tests are needed to verify route behavior.
3. Route behavior and status codes remain unchanged for existing API contracts.

### E2. Remove mixed in-memory vs DB vessel/environment authority in API (`P0`)

Completed: [ ]

Files: `src/server/api.ts`, supporting services under `src/server/*`

Tasks:

1. Choose one source of truth per resource path (DB-backed for persisted APIs).
2. Eliminate parallel in-memory APIs (`vesselStates`, mutable `environmentState`) from production routes or isolate them behind explicit test-only adapters.
3. Align auth/authorization consistently across vessel/environment endpoints.

Acceptance:

1. No production API endpoint serves vessel/environment from stale in-memory mirrors while related endpoints use DB state.
2. Auth expectations are consistent for equivalent route groups.
3. Regression tests cover read/write consistency across affected endpoints.

### E3. Decompose `src/server/index.ts` runtime orchestration (`P0`)

Completed: [ ]

Files: `src/server/index.ts`, new modules under `src/server/runtime/*` and `src/server/bootstrap/*`

Tasks:

1. Extract socket auth/bootstrap, connection wiring, and broadcast tick into separate modules.
2. Move interval lifecycle (`environment events`, `broadcast`) behind start/stop controllers.
3. Reduce test-only leakage by minimizing `__test__` exports to stable utility seams.

Acceptance:

1. `src/server/index.ts` reduced below 900 lines.
2. Runtime loops can be started/stopped deterministically in tests.
3. `tests/frontend/server/index.test.ts` no longer depends on broad `__test__` internals for core behavior validation.

### E4. Rework brittle server mega-tests into boundary-level suites (`P1`)

Completed: [ ]

Files: `tests/frontend/server/api.test.ts`, `tests/frontend/server/index.test.ts`

Tasks:

1. Replace `router.stack` traversal/manual middleware stepping with request-boundary tests.
2. Replace global mega-mock setup with scenario fixtures per suite.
3. Keep a small white-box utility test slice only for pure helpers.

Acceptance:

1. `tests/frontend/server/api.test.ts` no longer uses `router.stack`/`route.stack`.
2. Mock fan-out in `tests/frontend/server/index.test.ts` is materially reduced.
3. Failure messages map to user-visible/server-contract behavior, not implementation structure.

## Workstream F: Assembly Physics Core and Test Stability

Completed: [ ]

### F1. Split `assembly/index.ts` by concern (`P1`)

Completed: [ ]

Files: `assembly/index.ts`, new modules under `assembly/*` (params, environment, integration, getters)

Tasks:

1. Separate ABI parameter-index mapping and buffer handling from physics integration logic.
2. Extract `setVesselParams` mapping into table-driven or helper-based assignment logic.
3. Keep `updateVesselState` readable via focused helper stages (actuation, forces, wave/heave, integration).

Acceptance:

1. No single assembly physics module exceeds 500 lines.
2. Parameter mapping changes are centralized (single source of truth for param indices).
3. Existing wasm interface remains backward compatible.

### F2. Make assembly runtime state explicit and resettable (`P1`)

Completed: [ ]

Files: `assembly/index.ts`, `assembly/core.test.ts`

Tasks:

1. Either formalize single-vessel mode explicitly or introduce pointer-safe vessel registry semantics.
2. Add explicit environment reset helper so tests do not share hidden global environment state.
3. Document lifecycle expectations for `createVessel`/`destroyVessel`/reset functions.

Acceptance:

1. Test order no longer affects environment-dependent outcomes.
2. Global mutable state transitions are explicit and intentional.
3. Public API semantics are documented and covered by tests.

### F3. Harden `assembly/core.test.ts` with builders and targeted suites (`P1`)

Completed: [ ]

Files: `assembly/core.test.ts`

Tasks:

1. Introduce test builders/helpers for vessel creation and update steps to remove repeated argument lists.
2. Group tests by behavior domains (actuation, environment, parameter mapping, lifecycle).
3. Remove accidental argument-order hazards by using named helper options instead of long positional calls.

Acceptance:

1. Significant reduction of repeated raw `createVessel` call blocks.
2. Constructor/setup calls become explicit and less error-prone.
3. Test failures point to behavior domains, not fixture wiring noise.

## Workstream G: CSS Modules to Tailwind Consolidation

Completed: [ ]

### G1. Define migration guardrails and token mapping (`P0`)

Completed: [x]

Files: `src/styles/globals.css`, `tailwind.config.js`

Relevant files currently in CSS scope:

- `src/styles/globals.css`
- `src/components/HudDrawer.module.css` -> `src/components/HudDrawer.tsx`, `src/components/hud/HudPanels.tsx`, `src/components/hud/PhysicsInspectorPanel.tsx`, `src/components/SystemMeter.tsx`
- `src/pages/SimPage.module.css` -> `src/features/sim/SpaceModal.tsx`, `src/features/sim/JoinChoiceModal.tsx`
- `src/components/Layout.module.css` -> `src/components/Layout.tsx`
- `src/components/EnvironmentControls.module.css` -> `src/components/EnvironmentControls.tsx`
- `src/components/ChatPanel.module.css` -> `src/components/ChatPanel.tsx`
- `src/components/Dashboard.module.css` -> `src/components/Dashboard.tsx`
- `src/components/VesselCallout.module.css` -> `src/components/VesselCallout.tsx`
- `src/pages/Home.module.css` -> `src/pages/index.tsx`
- `src/pages/Spaces.module.css` -> `src/pages/spaces.tsx`
- `src/pages/Admin.module.css` -> `src/pages/admin.tsx`
- `src/pages/PhysicsDebug.module.css` -> `src/pages/physics-debug.tsx`
- `src/pages/Globe.module.css` -> `src/pages/globe.tsx`

Tasks:

1. [x] Document allowed CSS after migration: global reset/base styles and theme variables only.
2. [x] Move reusable visual primitives (buttons, cards, pills, overlays) into Tailwind tokenized utility patterns.
3. [x] Expand Tailwind theme tokens where needed so module CSS values map to named utilities.
4. [x] Define explicit exceptions where Tailwind is not feasible (for example: highly specific pseudo-element geometry) and keep them minimal.

Acceptance:

1. `globals.css` contains only base/theme concerns, not component/page-specific rules.
2. Tailwind token coverage is sufficient to replace repeated module color/spacing definitions.
3. Exception list is documented and justified.

### G2. Migrate HUD and simulation overlay CSS modules first (`P0`)

Completed: [x]

Files: `src/components/HudDrawer.module.css`, `src/pages/SimPage.module.css`, `src/components/HudDrawer.tsx`, `src/components/hud/HudPanels.tsx`, `src/components/hud/PhysicsInspectorPanel.tsx`, `src/components/SystemMeter.tsx`, `src/features/sim/SpaceModal.tsx`, `src/features/sim/JoinChoiceModal.tsx`

Tasks:

1. Replace module class usage with Tailwind classes (including responsive and landscape variants).
2. Remove mixed style strategy in files already combining module styles and Tailwind (`HudPanels.tsx`, `JoinChoiceModal.tsx`).
3. Keep behavior parity for HUD docking, tab states, modal overlays, and scroll regions.

Acceptance:

1. No `HudDrawer.module.css` or `SimPage.module.css` imports remain.
2. No mixed module+Tailwind styling remains in `HudPanels.tsx` and `JoinChoiceModal.tsx`.
3. HUD/modal behavior and layout remain unchanged across desktop/mobile.

### G3. Migrate navigation, dashboard, and control panels (`P1`)

Completed: [ ]

Files: `src/components/Layout.module.css`, `src/components/EnvironmentControls.module.css`, `src/components/ChatPanel.module.css`, `src/components/Dashboard.module.css`, `src/components/Layout.tsx`, `src/components/EnvironmentControls.tsx`, `src/components/ChatPanel.tsx`, `src/components/Dashboard.tsx`

Tasks:

1. Convert shared panel/card/form/button patterns to Tailwind class composition.
2. Replace hover/focus/disabled pseudo-state module styles with Tailwind variants.
3. Preserve accessibility styling (focus rings, contrast, disabled affordances).

Acceptance:

1. No imports remain for `Layout.module.css`, `EnvironmentControls.module.css`, `ChatPanel.module.css`, or `Dashboard.module.css`.
2. Interactive states are preserved via Tailwind variants.
3. No regressions in nav dropdowns, chat input states, or weather panel interactions.

### G4. Migrate page-level modules and finalize cleanup (`P1`)

Completed: [ ]

Files: `src/pages/Home.module.css`, `src/pages/Spaces.module.css`, `src/pages/Admin.module.css`, `src/pages/PhysicsDebug.module.css`, `src/pages/Globe.module.css`, `src/components/VesselCallout.module.css`, plus their consuming `tsx` files

Tasks:

1. Convert page layouts, hero sections, tables/forms, and cards to Tailwind classes.
2. For animation and pseudo-element-heavy areas (for example Home hero glows and VesselCallout arrow), use Tailwind arbitrary values where practical and keep tiny residual CSS only when necessary.
3. Remove obsolete CSS modules and dead style exports.

Acceptance:

1. All `.module.css` files are removed or reduced to explicitly approved exceptions.
2. Any remaining CSS module is small, documented, and tied to a non-feasible Tailwind case.
3. Styling across home/spaces/admin/physics/globe/callout remains visually consistent.

### G5. Add style-system guardrails to prevent regression (`P2`)

Completed: [ ]

Files: frontend lint config and docs

Tasks:

1. Add lint or static checks to block new `.module.css` imports outside approved exception paths.
2. Document Tailwind-first styling rules and migration patterns for contributors.
3. Add lightweight snapshot/visual checks for critical styled surfaces.

Acceptance:

1. New module-CSS usage does not increase after migration.
2. Contributors have a clear Tailwind-first guideline with exception process.
3. Styling regressions are caught earlier in CI for key pages/components.

## Workstream H: Client Networking and Store Core Decomposition

Completed: [ ]

### H1. Split `src/networking/socket.ts` by responsibility (`P0`)

Completed: [ ]

Files: `src/networking/socket.ts`, new modules under `src/networking/socket/*`

Tasks:

1. Extract connection/auth lifecycle logic, inbound event handlers, and outbound command senders into separate modules.
2. Move simulation-update projection and chat-history mapping into pure helper functions with targeted unit tests.
3. Keep `socket.ts` as a thin facade that wires dependencies and event registration.

Acceptance:

1. `src/networking/socket.ts` reduced below 600 lines.
2. No extracted handler module exceeds 400 lines.
3. Existing socket behavior remains unchanged (auth, chat, simulation, admin flows).

### H2. Remove hidden global dependencies from socket manager (`P0`)

Completed: [ ]

Files: `src/networking/socket.ts`, new adapters under `src/networking/adapters/*`

Tasks:

1. Replace direct `useStore.getState()` reads inside socket handlers with an injected store adapter interface.
2. Add factory creation path (`createSocketManager(...)`) for tests and runtime bootstrap; keep singleton only as a thin default export wrapper.
3. Make channel/space resolution deterministic from explicit inputs instead of implicit global reads.

Acceptance:

1. `useStore.getState()` calls in socket manager are removed from event-path logic.
2. `socketManager` tests no longer require broad `jest.doMock('../../src/store')` interception to run.
3. Runtime wiring remains backward compatible for existing imports.

### H3. Slice `src/store/index.ts` into domain stores (`P0`)

Completed: [ ]

Files: `src/store/index.ts`, new slice modules under `src/store/slices/*`

Tasks:

1. Split store creation into domain slices (`session`, `vessel`, `environment`, `chat`, `missions`, `machinery`, `navigation`).
2. Move deep vessel merge logic into dedicated utilities and unit-test merge semantics.
3. Keep exported store API stable while reducing coupling between unrelated domains.

Acceptance:

1. `src/store/index.ts` reduced below 500 lines.
2. `updateVessel` complexity and nesting are materially reduced via tested helpers.
3. Existing store consumers compile without behavior regressions.

### H4. Remove placeholder/dead paths and fix interval lifecycle (`P1`)

Completed: [ ]

Files: `src/networking/socket.ts`, `src/store/index.ts`

Tasks:

1. Implement or remove no-op `updateVesselPosition(...)` in socket manager.
2. Implement or remove empty `updateWaterStatus(...)` path in store.
3. Replace `setDayNightCycle` simplified interval setup with explicit start/stop lifecycle and teardown semantics.

Acceptance:

1. No placeholder comments remain for production paths in these files.
2. Interval/timer resources are explicitly tracked and cleaned up.
3. Tests cover enable/disable and cleanup behavior for the day/night cycle path.

## Workstream I: Physics Bridge Call-Site Simplification

Completed: [ ]

### I1. Replace repeated positional `createVessel(...)` calls with typed input builders (`P0`)

Completed: [x]

Files: `src/simulation/simulationLoop.ts`, `src/lib/wasmBridge.ts`, `tests/frontend/simulationLoop.test.ts`, `tests/frontend/wasmBridge.test.ts`

Tasks:

1. Introduce a typed `CreateVesselInput` model and helper that encapsulates defaulting/clamping logic once.
2. Replace repeated positional call chains in initialize/teleport/resync paths with shared builder usage.
3. Add targeted tests that validate mapping from named input fields to wasm call arguments.

Acceptance:

1. No duplicated 30+ argument `createVessel(...)` call chains remain in `simulationLoop.ts`.
2. Argument-order mistakes are prevented by typed named-field builders.
3. Existing physics/bootstrap tests remain green.

## Workstream J: Type Safety Hardening

Completed: [ ]

### J1. Enforce full-app typecheck in CI (`P0`)

Completed: [x]

Files: `tsconfig.json`, `package.json`, CI workflow config

Tasks:

1. [x] Add explicit `typecheck` script (`tsc --noEmit`) and wire it into CI.
2. [x] Expand `tsconfig.json` include patterns to type-check `*.tsx` files (not only `*.ts`).
3. [ ] Keep exclusions intentional and documented (for example, generated artifacts or AssemblyScript boundaries).

Acceptance:

1. `npm run typecheck` exists and passes in CI.
2. `tsx` source files are part of compiler coverage.
3. Type errors fail CI before merge.

### J2. Remove unsafe auth non-null assertions in server routes (`P0`)

Completed: [x]

Files: `src/server/api.ts`, `src/server/middleware/authentication.ts`, shared auth helpers under `src/server/*`

Tasks:

1. [x] Replace repeated `req.user!` access with a typed guard/helper (`requireUser(req)` or equivalent) that narrows once.
2. [x] Refactor route handlers to consume narrowed user context rather than repeating non-null assertions.
3. [x] Add tests that validate authenticated and unauthenticated branches at handler boundaries.

Acceptance:

1. `req.user!` usage in `src/server/api.ts` is eliminated or reduced to narrow, justified adapter boundaries.
2. Auth-required route handlers compile without non-null assertions in normal paths.
3. Behavior remains unchanged for authorized/unauthorized requests.

### J3. Replace high-risk runtime casts with typed adapters (`P1`)

Completed: [ ]

Files: `src/pages/sim.tsx`, `src/lib/wasmLoader.ts`, `src/server/middleware/authentication.ts`, `src/components/HudDrawer.tsx`

Tasks:

1. Replace `unknown as` chains with explicit type guards or narrow helper functions.
2. Introduce local adapter types where external libraries return weakly typed payloads.
3. Keep casts only at documented interop boundaries (wasm/runtime shims), with minimal surface area.

Acceptance:

1. Unsafe cast hotspots in listed files are reduced materially.
2. Remaining casts are isolated and documented as boundary adapters.
3. No behavior regressions in session/auth/wasm/hud flows.

### J4. Add lint guardrails for nesting and parameter count (`P1`)

Completed: [ ]

Files: ESLint config and contributor docs

Tasks:

1. Add `max-depth` rule (target `3`) with limited, documented exceptions.
2. Add `max-params` rule (target `3`) and guidance for parameter objects.
3. Add migration notes for existing unavoidable exceptions (for example, wasm bridge ABI functions).

Acceptance:

1. New code defaults to low nesting and max-3 parameter signatures.
2. Exceptions are explicit and reviewed, not implicit drift.
3. Lint catches regressions automatically.

## Workstream K: Security Hardening

Completed: [ ]

### K1. Close IDOR on settings endpoints (`P0`)

Completed: [x]

Files: `src/server/api.ts`

Tasks:

1. [x] Enforce subject binding on `GET/POST /settings/:userId` (self-only unless admin).
2. [x] Add explicit authorization helper for user-scoped resources to avoid repeated ad-hoc checks.
3. [x] Add regression tests for self-access, cross-user denial, and admin override.

Acceptance:

1. Non-admin users cannot read or modify another user's settings.
2. Admin behavior remains explicit and tested.
3. Existing settings behavior for the owning user remains unchanged.

### K2. Tighten vessel state mutation authorization (`P0`)

Completed: [x]

Files: `src/server/api.ts`, `src/server/middleware/authorization.ts`

Tasks:

1. [x] Add strict ownership/role checks on vessel mutation routes keyed by `:userId`.
2. [x] Prevent generic `vessel:update` permission from granting cross-user mutation power.
3. [x] Add tests proving cross-user updates/deletes are denied.

Acceptance:

1. Authenticated non-admin users cannot mutate vessel state for other users.
2. Route-level policy is explicit and centralized.
3. Existing allowed owner/admin flows continue to pass.

### K3. Require auth/authorization for editor write APIs (`P0`)

Completed: [x]

Files: `src/pages/api/editor/packs/index.ts`, `src/pages/api/editor/packs/[packId].ts`, `src/pages/api/editor/compile.ts`, `src/pages/api/editor/overlay.ts`

Tasks:

1. Require authenticated session for editor write routes (`POST`, `PATCH`, `DELETE`, compile artifact writes).
2. Derive actor identity server-side (do not trust client-provided `ownerId`).
3. Add role/ownership checks for pack updates/deletes/status transitions.

Acceptance:

1. Anonymous users cannot create/update/delete packs or write compile artifacts.
2. Ownership cannot be spoofed via request payload.
3. Existing read paths remain available only where intended.

### K4. Add request-size/rate guardrails to artifact and register flows (`P0`)

Completed: [x]

Files: `src/pages/api/editor/compile.ts`, `src/server/editorCompilationStore.ts`, `src/pages/api/register.ts`, server middleware/bootstrap

Tasks:

1. Enforce payload bounds (tile/layer counts, max serialized bytes) on compile requests.
2. Add rate-limiting/backpressure for compile and registration endpoints.
3. Add storage safety limits/retention policy for artifact persistence to prevent unbounded disk growth.

Acceptance:

1. Oversized or high-frequency abuse traffic is rejected predictably.
2. Artifact persistence cannot grow unbounded without cleanup policy.
3. Normal user/editor flows remain functional within documented limits.

### K5. Harden production origin controls (`P1`)

Completed: [ ]

Files: `src/server/index.ts`

Tasks:

1. Remove `origin: true` production fallback for both Express and Socket.IO CORS configuration.
2. Fail fast at startup when production allowlist env vars are missing/invalid.
3. Keep explicit local-dev behavior separate from production policy.

Acceptance:

1. Production startup does not proceed with wildcard/reflective origin fallback.
2. Credentialed cross-origin access is restricted to configured origins.
3. Dev workflow remains usable with clear config defaults.

### K6. Remove secret-bearing query parameters from space access flow (`P1`)

Completed: [ ]

Files: `src/server/api.ts`, frontend callers for space join/list flows

Tasks:

1. Move private-space password submission out of query string into request body (POST boundary).
2. Keep invite token/password verification behavior while avoiding URL-based secret transport.
3. Add tests validating password-required, invalid-password, and success paths after endpoint contract change.

Acceptance:

1. Space passwords are no longer accepted via query string.
2. Equivalent join/access behavior is preserved through body-based API flow.
3. No password material appears in request URLs for this flow.

### K7. Make cookie parsing resilient in socket handshake (`P1`)

Completed: [ ]

Files: `src/server/index.ts`

Tasks:

1. Wrap cookie value decode in safe parsing logic (malformed pairs do not throw).
2. Ignore invalid cookie fragments without aborting handshake processing.
3. Add targeted tests for malformed cookie headers.

Acceptance:

1. Malformed cookie inputs do not crash or short-circuit socket auth middleware.
2. Valid cookies continue to parse and authenticate correctly.
3. Logging avoids leaking full cookie contents.

### K8. Add security baseline controls and documentation (`P2`)

Completed: [ ]

Files: server bootstrap/config docs, API docs

Tasks:

1. Document required production security env (`FRONTEND_URL`, `NEXTAUTH_SECRET`, rate-limit config).
2. Add a lightweight security checklist for new API/socket endpoints (auth, authorization, input bounds, logging hygiene).
3. Add tests or static checks for critical security invariants where practical.

Acceptance:

1. Security-critical configuration requirements are explicit and versioned.
2. New endpoint development has a repeatable security review checklist.
3. Security regressions are caught earlier in CI/review.

### K9. Make credential lockout state user-visible with countdown (`P1`)

Completed: [ ]

Files: credential auth API/error surface, login UI (`src/pages/login.tsx` and related auth components)

Tasks:

1. Expose lockout remaining time in a safe, consistent error shape (for example `retryAfterSeconds`) for credential-login lockout responses.
2. Render a visible lockout countdown in the login UI and disable submit while lockout is active.
3. Keep lockout security behavior unchanged (correct password during active lockout is still rejected until expiry).
4. Add tests for lockout active, countdown display, and post-expiry recovery.

Acceptance:

1. Users see explicit lockout duration and a live countdown after lockout triggers.
2. Lockout responses remain non-enumerating and do not leak sensitive account state.
3. Login becomes available again automatically when lockout expires.
4. Relevant auth and UI tests pass.

## Workstream L: Performance, Reliability, and State-Consistency Hardening

Completed: [ ]

### L1. Replace synchronous auth crypto on request paths (`P0`)

Completed: [x]

Files: `src/pages/api/register.ts`, `src/pages/api/auth/[...nextauth].ts`

Tasks:

1. Replace `bcrypt.hashSync`/`bcrypt.compareSync` with async `bcrypt.hash`/`bcrypt.compare`.
2. Preserve lockout and audit behavior while moving to non-blocking auth flow.
3. Add/adjust tests for success/failure/lockout auth paths.

Acceptance:

1. No synchronous bcrypt API usage remains in request handlers.
2. Auth/register behavior is unchanged from API-contract perspective.
3. Relevant auth tests pass.

### L2. Remove synchronous disk writes/reads from hot server paths (`P0`)

Completed: [ ]

Files: `src/server/editorCompilationStore.ts`, `src/server/editorPacksStore.ts`, `src/server/vesselCatalog.ts`

Tasks:

1. Replace sync fs calls (`readFileSync`, `writeFileSync`, `mkdirSync`) with `fs/promises` equivalents in request-triggered/hot paths.
2. Add serialized/debounced write strategy so concurrent writes do not corrupt JSON store files.
3. Move vessel catalog refresh to async cache management so request handlers do not perform sync file IO.
4. Keep corrupt-file recovery/fallback behavior explicit and tested.

Acceptance:

1. No synchronous fs calls remain in request-triggered/hot server paths covered by this task.
2. Concurrent compile/pack updates do not cause data-loss/corruption regressions.
3. Catalog lookups no longer block request handlers on TTL refresh.
4. Relevant editor/server tests pass.

### L3. Harden tile proxy routes against upstream failures (`P1`)

Completed: [ ]

Files: `src/pages/api/tiles/terrain/[z]/[x]/[y].ts`, `src/pages/api/tiles/land/[z]/[x]/[y].ts`

Tasks:

1. Add timeout and `try/catch` handling for upstream fetch calls.
2. Normalize upstream error mapping (`502`/`504`) and avoid leaking raw internal errors.
3. Validate required base URL config and fail predictably when missing.

Acceptance:

1. Upstream timeouts/network errors return controlled API responses instead of uncaught exceptions.
2. Successful tile responses remain unchanged (content type/cache headers).
3. Route tests cover success, upstream failure, and timeout paths.

### L4. Replace fixed polling loops with observer/event-driven triggers where feasible (`P1`)

Completed: [ ]

Files: `src/components/Scene.tsx`, `src/features/editor/components/EditorViewport.tsx`, `src/pages/admin.tsx`

Tasks:

1. Replace spectator HUD footer polling in `Scene` with `ResizeObserver`/event-driven updates.
2. Replace `EditorViewport` 400ms overlay polling with camera/work-area-triggered refresh plus bounded throttling.
3. Replace admin socket connectivity polling with connection events; keep metrics polling bounded and visibility-aware.

Acceptance:

1. Fixed-interval polling is removed or materially reduced for listed UI paths.
2. UI status/overlay behavior remains functionally equivalent.
3. Relevant component/page tests pass.

### L5. Unify runtime/API state authority contracts (`P0`)

Completed: [ ]

Files: `src/server/api.ts`, `src/server/index.ts`, shared server services

Tasks:

1. Define a single production authority per resource (`vessels`, `environment`, `settings`) and route all mutations through it.
2. Remove in-module mirrors (`vesselStates`, `environmentState`, `userSettingsStore`) from production paths or isolate behind explicit dev/test adapters.
3. Add consistency tests across HTTP and socket flows to verify convergent state.

Acceptance:

1. Parallel mutable stores for the same production resource are eliminated.
2. HTTP and socket consumers read consistent vessel/environment/settings state.
3. Persistence/reload behavior remains deterministic in tests.

## Workstream M: Developer Experience and Tooling Ergonomics

Completed: [ ]

### M1. Stabilize frontend test harness and docs parity (`P0`)

Completed: [x]

Files: `jest.config.js`, `package.json`, `README.md`

Tasks:

1. [x] Align Jest transformer stack with supported versions and remove brittle config assumptions.
2. [x] Ensure README test commands match actual npm scripts and current tooling behavior.
3. [x] Add a lightweight smoke command for focused auth/api suite verification.

Acceptance:

1. `npm run test:frontend` works on a clean install without manual local tweaks.
2. README test instructions are accurate and current.
3. Focused test command(s) for changed areas are documented and reliable.

### M2. Enforce typecheck as a first-class workflow (`P0`)

Completed: [x]

Files: `tsconfig.json`, `package.json`, CI/workflow config

Tasks:

1. [x] Ensure TypeScript coverage includes both `ts` and `tsx` sources for app code.
2. [x] Add explicit `npm run typecheck` script and use it in routine quality gates.
3. [x] Document expected typecheck command in README/contributor docs.

Acceptance:

1. Type errors in `tsx` app code fail the typecheck step.
2. Typecheck is a standard local and CI command.
3. Contributors have one documented source-of-truth command for static typing checks.

### M3. Add baseline CI quality gates (`P0`)

Completed: [x]

Files: `.github/workflows/*`, `package.json`

Tasks:

1. Add CI workflow that runs lint, typecheck, and core tests on PR/push.
2. Keep CI scope pragmatic (fast baseline first; expand with targeted suites).
3. Fail fast on broken setup (missing env/config assumptions).

Acceptance:

1. Repository has active automated PR quality gates.
2. Lint/typecheck/test regressions are caught before merge.
3. CI setup is documented and reproducible locally.

### M4. Strengthen git hook guardrails for push-time feedback (`P1`)

Completed: [ ]

Files: `.husky/pre-commit`, `.husky/pre-push`, `package.json`

Tasks:

1. Keep pre-commit fast (`lint-staged`) but add pre-push checks for typecheck + targeted tests.
2. Ensure hook failure messages point to exact fix commands.
3. Keep hook behavior consistent across environments.

Acceptance:

1. Broken typecheck or critical tests are blocked before push.
2. Pre-commit remains low-latency for normal coding flow.
3. Developer hook behavior is predictable and documented.

### M5. Improve local test iteration speed (`P1`)

Completed: [ ]

Files: `jest.config.js`, `package.json`

Tasks:

1. Disable default always-on coverage for local test runs and provide explicit coverage script.
2. Add fast-targeted test scripts for high-change areas (auth/api, hud/sim core).
3. Document when to use fast vs full suite commands.

Acceptance:

1. Default local frontend test runs are materially faster.
2. Coverage remains available via explicit command.
3. Team has a clear fast-feedback testing path.

### M6. Remove command/bootstrap drift across Docker/scripts/docs (`P1`)

Completed: [ ]

Files: `docker-compose.yml`, `scripts/*`, `README.md`

Tasks:

1. Reconcile server bootstrap command(s) with scripts that actually exist.
2. Keep auth bootstrap/seed flow explicit and consistent in docs.
3. Add a lightweight check to detect missing script references in bootstrap paths.

Acceptance:

1. Docker startup does not reference missing scripts.
2. Auth bootstrap steps are accurate for new contributors.
3. Command drift is less likely to regress unnoticed.

## Suggested Execution Order (Small PR Sequence)

1. `A1` HudDrawer decomposition (phase 1: hooks extraction only).
2. `A2` HudPanels split.
3. `J1` enforce full-app typecheck in CI (`ts` + `tsx`).
4. `K1` close IDOR on settings endpoints.
5. `K2` tighten vessel state mutation authorization.
6. `K3` require auth/authorization for editor write APIs.
7. `K4` add request-size/rate guardrails for compile/register flows.
8. `H1` split socket manager by responsibility.
9. `H2` remove hidden global dependencies in socket manager.
10. `H3` split store into domain slices.
11. `I1` replace repeated `createVessel` positional call chains.
12. `J2` remove unsafe auth non-null assertions in server routes.
13. `H4` remove placeholder paths and fix interval lifecycle.
14. `B6` split and type `socketManager` tests.
15. `B1` `api.test.ts` route-internals removal.
16. `C2` remove render-path `getState` in HUD chat props.
17. `C3` unify control update pipeline (HUD + keyboard).
18. `A3` SimPage split (space/session/keyboard hooks).
19. `B2` server/index test fixture modularization.
20. `A4` Scene split.
21. `B3` simulation loop test seam cleanup.
22. `C1` consolidate vessel derivation selectors across HUD/Scene/Sim.
23. `A5` RadarDisplay split.
24. `C4` reduce high-frequency UI state churn.
25. `J3` replace high-risk runtime casts with typed adapters.
26. `K5` harden production origin controls.
27. `K6` remove password-in-query space flow.
28. `K7` make socket cookie parsing resilient.
29. `D1` inline-style component extraction.
30. `D2` typed-test hardening.
31. `E1` split server API router by domain.
32. `E2` unify API state/auth boundaries (DB vs in-memory cleanup).
33. `E3` decompose server runtime (`index.ts`).
34. `E4` harden server mega-tests at boundary level.
35. `F1` split assembly physics core modules.
36. `F2` make assembly state reset semantics explicit.
37. `F3` refactor assembly core tests with builders.
38. `G1` define CSS->Tailwind guardrails/tokens.
39. `G2` migrate HUD + sim modal CSS modules.
40. `G3` migrate layout/dashboard/chat/environment control modules.
41. `G4` migrate remaining page-level CSS modules.
42. `G5` enforce styling guardrails (no new module CSS drift).
43. `J4` enforce nesting/parameter lint guardrails.
44. `K8` add security baseline controls/documentation.
45. `A6`/`A7` and `B5` cleanup.
46. `L1` replace sync auth crypto in request paths.
47. `L2` remove sync editor disk writes on request-triggered paths.
48. `L3` harden tile proxy upstream failure handling.
49. `L4` replace polling-heavy UI loops with observer/event-driven patterns.
50. `L5` unify API/runtime state authority contracts.
51. `K9` make credential lockout state user-visible with countdown.
52. `M1` stabilize frontend test harness and docs parity.
53. `M2` enforce full typecheck workflow (`ts` + `tsx` coverage + script).
54. `M3` add baseline CI quality gates.
55. `M4` strengthen push-time git hooks.
56. `M5` improve local test iteration speed.
57. `M6` remove Docker/scripts/docs command drift.

## Definition of Done

1. Top `P0` items completed.
2. No critical frontend orchestration module above 500 lines in the targeted set (`HudDrawer`, `sim.tsx`, `Scene`, `RadarDisplay`, `MarineRadio`).
3. Client runtime core hotspots are decomposed (`src/networking/socket.ts` below 600 lines, `src/store/index.ts` below 500 lines).
4. Repeated positional vessel-constructor call chains are replaced by typed builder usage in `simulationLoop.ts`.
5. Placeholder/dead paths are removed from targeted client runtime files (`updateVesselPosition`, `updateWaterStatus`, simplified interval placeholders).
6. Server hotspot modules are reduced and decomposed (`src/server/api.ts` below 600 lines, `src/server/index.ts` below 900 lines).
7. Assembly hotspot modules are decomposed with explicit state semantics (`assembly/index.ts` split and test reset boundaries clear).
8. `api.test.ts` and `server/index.test.ts` no longer couple to framework internals for core behavior checks.
9. `socketManager` and simulation-loop tests are boundary-oriented and typed, without heavy private-state poking.
10. Render-path `useStore.getState()` reads are eliminated.
11. Control updates have one authoritative pipeline with no duplicate emissions.
12. Full-app typecheck is enforced in CI (`npm run typecheck`) and includes both `ts` and `tsx` sources.
13. Touched code keeps control-flow nesting depth at `<= 3` by default; exceptions are explicit and justified.
14. Touched function/method signatures use `<= 3` parameters by default; parameter objects are used when context exceeds this.
15. User-scoped server resources enforce subject binding (no cross-user settings/vessel mutation without explicit admin policy).
16. Editor write/compile APIs require authenticated, authorized actors and server-derived ownership.
17. Payload/rate controls are in place for abuse-prone endpoints (at minimum compile and registration flows).
18. Production origin policy is strict (no wildcard/reflective fallback with credentials enabled).
19. Secret-bearing query params are removed from space password flow.
20. Socket cookie parsing is resilient to malformed inputs without crashing auth middleware.
21. Lint and tests pass for every merged backlog PR.
22. CSS Modules are removed from targeted frontend surfaces, except explicitly documented non-feasible exceptions.
23. CI remains green throughout, with no net loss in behavioral coverage of critical user flows.
24. Request handlers avoid blocking sync crypto and sync disk I/O on hot paths.
25. Upstream proxy dependencies (tile APIs) fail gracefully with bounded timeout/error handling.
26. Polling-heavy UI/runtime loops are replaced with observer/event-driven or bounded lifecycle-managed alternatives.
27. Production resource state authority is unified (no divergent parallel stores for vessels/environment/settings).
28. Changed behavior is covered by happy-path, sad-path, and edge-case automated tests.
29. Credential lockout UX includes visible retry timing (countdown) while preserving lockout security behavior.
30. README run/test/lint guidance matches actual scripts and current project behavior.
31. Frontend tests run on a clean install with a stable, documented Jest toolchain.
32. Full-app typecheck (including `tsx`) is a standard local and CI quality gate.
33. Repository has automated CI checks for lint, typecheck, and core tests.
34. Docker/bootstrap commands do not reference missing scripts.
