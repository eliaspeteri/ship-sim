# Ship Simulator (Lean MVP)

Single-player ship controls in the browser. Minimal scope: 2D water plane with Gerstner waves, stable 3-DOF physics (surge/sway/yaw), simple HUD and controls, in-memory auth (JWT, HttpOnly cookies), no database, no Docker, no tile server, no AI traffic.

## What Works

- AssemblyScript + WASM physics core with fixed timestep integration.
- React/Next.js UI with HUD and basic controls (helm, throttle, rudder).
- In-memory auth (register/login) with JWT access/refresh cookies.
- Simple environment state (wind/current/sea state) stored in memory.

## What’s Not Included (Deferred)

- Globe or tiling server (sticking to a 2D plane for now).
- Database persistence.
- Docker.
- AI traffic or multiplayer.
- Advanced bridge systems (radar/ECDIS/GMDSS/conning), missions, or complex weather ingestion.

## Quickstart

```sh
npm install
# Start backend API (port 3001)
npm run server
# In a second terminal, start frontend + wasm build
npm run dev
```

- Login/register at `http://localhost:3000/login` (defaults: admin/admin).
- Simulation runs continuously at a fixed timestep.

## Configuration

- `.env` (already provided):
  - `PORT=3001`
  - `AUTH_SECRET`, `NEXTAUTH_SECRET` (JWT signing)
  - `ADMIN_USERNAME`, `ADMIN_PASSWORD` (seeded admin user)

## Testing & Quality

```sh
npm run astest             # AssemblyScript unit tests
npm run wasm:check-exports # Validate WASM exports
npm run lint               # eslint
npm run format             # prettier
```

> Jest is currently disabled; use `npm run astest` for physics tests.

## MVP TODOs (small, actionable tasks)

- Physics
  - [x] Harden fixed timestep loop for WASM; ensure single application per frame.
  - [x] Add AS tests for thrust/drag signs, clamping, and heading updates.
  - [ ] Wire Gerstner wave input (sea state → amplitude/steepness) into physics forces.
  - Rendering/UI
    - [ ] Ensure Gerstner waves animate with correct phase and normals.
    - [x] Keep HUD minimal: speed, heading, throttle, rudder, sea state.
  - [ ] Controls: keyboard/mouse for throttle and rudder; reset button.
- Auth
  - [ ] Add minimal rate limiting/lockout to auth endpoints.
  - [ ] Add logout endpoint wiring to UI.
- State
  - [ ] Save/load vessel + env to localStorage for session continuity.
  - [ ] Remove any leftover DB calls in client code (cleanup).
  - Tooling
    - [ ] Add a smoke e2e (login ? start sim ? move vessel).
    - [x] Keep wasm export check (`npm run wasm:check-exports`) green.

## Roadmap

- See `roadmap.md` for the broader feature roadmap and role/mode plans.

## Contributing Notes

- Keep interfaces small at the WASM boundary; no default params; explicit types.
- Avoid magic numbers—put constants in config modules.
- Prefer pure functions for physics; isolate rendering, state, and transport.
