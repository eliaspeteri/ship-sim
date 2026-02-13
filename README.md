# Ship Simulator

Multiplayer ship simulation in the browser with a WASM physics core, realtime sockets, and a docked HUD for navigation, weather, and bridge systems.

## What Works

- AssemblyScript + WASM physics core with fixed timestep integration.
- Next.js frontend with HUD/navigation/weather/chat and bridge system stubs.
- Express + Socket.IO backend with space lifecycle and realtime vessel updates.
- NextAuth credentials auth with Prisma/Postgres persistence.
- Spaces (public/private), invite tokens, and per-space weather persistence.
- Integrated tile stack (`pg_tileserv`, GeoServer, terrain tile hosting).

## Deferred / In Progress

- Full globe-first gameplay UX (project currently uses a 2D navigation plane).
- Live weather ingestion, scenarios, and mission/economy depth.
- Full bridge systems (AIS/ECDIS/GMDSS/conning/radar) beyond current stubs.

## Quickstart (Recommended)

Run the full stack in Docker:

```sh
npm install
npm run docker:up
```

Primary endpoints:

- App: `http://localhost:3000`
- API + sockets: `http://localhost:3001`
- pg_tileserv: `http://localhost:7800`
- GeoServer: `http://localhost:8888/geoserver`
- Terrain tile host: `http://localhost:8090`

Stop everything:

```sh
npm run docker:down
```

## Local Dev Mode (Optional)

Use Docker only for infrastructure and run frontend/backend directly:

```sh
npm install
npm run docker:infra:up

# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Stop infra-only services:

```sh
npm run docker:infra:down
```

## Auth Bootstrap

- Register/login at `http://localhost:3000/login`.
- Docker startup runs `node scripts/seed-admin.js` in the server container (idempotent).
- If you want a seeded admin account, run:

```sh
node scripts/seed-admin.js
```

Defaults for the seeding script are `admin/admin` unless overridden by env vars.

## Configuration

Use the example env files as baseline:

- `.env.example`
- `.env.frontend.example`
- `.env.db.example`
- `.env.tiles.example`
- `.env.geoserver.example`

## Testing and Quality

```sh
npm run test                # unit + frontend + assemblyscript
npm run test:unit           # node test runner tests/unit/*.mjs
npm run test:frontend       # jest frontend suite (from jest.config.js)
npm run test:frontend:coverage # frontend suite with coverage report
npm run test:frontend:smoke # focused auth/api frontend suite
npm run test:frontend:sim-core # focused HUD/sim frontend suite
npm run test:assemblyscript # as-test
npm run test:e2e            # smoke e2e (requires SMOKE_E2E=true)
npm run test:e2e:playwright # Playwright browser smoke suite
npm run test:e2e:playwright:headed # Playwright in headed Chromium
npm run test:e2e:playwright:ui # Playwright UI mode

npm run typecheck           # tsc --noEmit
npm run check:bootstrap     # verify referenced bootstrap scripts exist
npm run wasm:check-exports  # wasm export contract check
npm run lint                # eslint
npm run lint:errors         # eslint --max-warnings 0
npm run format              # prettier
```

Playwright setup notes:

- Install browser binaries once: `npx playwright install chromium`
- Override port/base URL if needed: `PLAYWRIGHT_PORT=3100` / `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`

Recommended test loop:

- Use `npm run test:frontend:smoke` or `npm run test:frontend:sim-core` while iterating locally.
- Use `npm run test` before merging or when touching multiple domains.
- Use `npm run test:frontend:coverage` only when you need a coverage report.

## Roadmap

- Product roadmap: `roadmap.md`
- Refactor and quality backlog: `docs/refactor-backlog.md`
- AI coding guardrails: `docs/ai-engineering-guardrails.md`
- Tailwind migration guardrails: `docs/tailwind-migration-guardrails.md`

## Contributing Notes

- Keep WASM boundary interfaces explicit and stable.
- Avoid magic numbers; prefer named constants.
- Prefer pure functions for physics/rules and isolate side effects.
