# Ship Simulator

Multiplayer ship simulation in the browser with a WASM physics core, realtime sockets, and a docked HUD for navigation, weather, and bridge systems.

## What Works

- AssemblyScript + WASM physics core with fixed timestep integration.
- Next.js UI with a HUD drawer for navigation, weather, chat, and bridge stubs.
- NextAuth credentials auth backed by Prisma/Postgres.
- Spaces (public/private) with invite tokens and per-space weather persistence.
- Server-driven day/night cycle with per-space environment updates.
- Chat with global + vessel channels and paginated history.

## What’s Not Included (Deferred)

- Globe/tiling server (sticking to a 2D plane for now).
- Live weather ingestion, scenarios, and missions/economy loops.
- Full bridge systems (AIS/ECDIS/GMDSS/conning/radar) beyond current stubs.

## Quickstart

```sh
npm install

# Start infra services (PostGIS + pg_tileserv + GeoServer)
npm run docker:infra:up

# Start backend API (default port is 3001)
npm run server

# In a second terminal, start frontend + WASM build (default port is 3000)
npm run dev

# Full stack in Docker (frontend + server + infra)
npm run docker:up
```

- Login/register at `http://localhost:3000/login` (defaults: admin/admin).
- The socket server listens on `http://localhost:3001`.

## Configuration

- See `.env.example` for environment variables (database URL, NextAuth secrets, server URLs).

## Dev vs Docker

- Local dev (fastest HMR): run infra in Docker with `npm run docker:infra:up`, then run `npm run server` and `npm run dev` locally.
- Full Docker stack (prod-like): run everything with `npm run docker:up` and stop with `npm run docker:down`.

## Testing & Quality

```sh
npm run astest             # AssemblyScript unit tests
npm run wasm:check-exports # Validate WASM exports
npm run lint               # eslint
npm run format             # prettier
```

> Jest is currently disabled; use `npm run astest` for physics tests.

## Roadmap

- See `roadmap.md` for the consolidated feature backlog and role/mode plans.

## Contributing Notes

- Keep interfaces small at the WASM boundary; no default params; explicit types.
- Avoid magic numbers—put constants in config modules.
- Prefer pure functions for physics; isolate rendering, state, and transport.
