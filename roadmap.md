# Roadmap TODOs

## Core access & social

- [x] Roles & permissions (Guest / Spectator / Player / Admin)
- [x] Spectator mode + Player mode + robust switching
- [x] Vessel join/create UX (crew slots, spawn picker, chat replay)
- [x] Global chat + vessel-local chat
- [x] Spaces (public/private, invites, manage my spaces, scenarios/tutorial spaces)
- [x] Shared layout/navbar + HUD overhaul + mobile landscape mode

## Environment & world simulation

- [x] Server-driven weather per space + persisted state
- [x] Server-driven day/night cycle + local time from lat/lon
- [x] Timed events triggering environment presets
- [ ] Tide system (Earth-data-driven, regional or global)

## Vessel control & bridge systems

- [x] Ballast controls + feedback/state
- [x] Crew roles to avoid control conflicts (helm/engine/radio)
- [x] Admin reposition tools
- [x] AIS overlay + dual-band radar views

## Observability & performance

- [x] Metrics endpoint + socket latency sampling + centralized logs
- [x] Performance budgets (60 Hz sim + smooth rendering)

## Persistence & auth

- [x] Postgres + Prisma persistence (users, vessels, environment, bans/mutes, chat)
- [x] Migrations/seed + backup/restore
- [x] NextAuth review + hardening
- [x] Frontend tests (unit + smoke e2e)

## Core simulation

- [x] Replay/ghost mode + quick-start scenarios + AI pilot takeover
- [x] Globe/ocean rendering from Earth tiles + bathymetry grounding
- [x] Physics realism upgrades (hydro constants, waves, hull form/buoyancy)
- [x] Mission system + basic economy (costs, fuel, port fees, earnings)

---

## Map editor (layer-based, Earth-data-backed)

### Base assumptions

- [x] Terrain and bathymetry sourced from Earth tile servers (read-only)
- [ ] Overlay-based editor (no terrain sculpting)
- [ ] Tile-aligned streaming + LOD awareness

### Decor & atmosphere layers

- [ ] Vegetation painting (trees, bushes, scrub)
- [ ] Natural clutter (rocks, shoreline props)
- [ ] Man-made clutter (fences, poles, containers, signage)
- [ ] Biome presets (coastal, tundra, industrial, urban)
- [ ] No-decoration masks (ports, roads, restricted zones)

### Structures & clearance

- [ ] Bridges with clearance height metadata
- [ ] Overhead lines / cable crossings with clearance
- [ ] Radio masts, towers, chimneys
- [ ] Clearance zones for routing and vessel gating

### Ports & harbor infrastructure

- [ ] Port definitions (name, region, metadata)
- [ ] Dock / berth authoring (length, depth requirement)
- [ ] Fender zones / soft docking helpers
- [ ] Mooring points (bollards, dolphins)
- [ ] Anchorage areas (depth + seabed type)
- [ ] Port services metadata (fuel, repair, tug availability)

### Navigation aids

- [ ] Buoys (IALA A/B, type, shape, light characteristics)
- [ ] Beacons and daymarks
- [ ] Lighthouses and sector lights
- [ ] Leading lines / range markers
- [ ] Chart + 3D nav aid parity

### Zones & constraints

- [ ] Speed limit zones
- [ ] Restricted / exclusion zones
- [ ] No-anchoring zones
- [ ] Shallow-water caution zones
- [ ] Environmental rule zones (emissions, protected areas)

### Spawn points & routing

- [ ] Vessel spawn points (berth, anchor, offshore)
- [ ] Spawn constraints (vessel class, weather, time)
- [ ] Route authoring (waypoints, speed hints)
- [ ] AI route tagging (cargo, ferry, patrol, escort)
- [ ] Route validation (depth, clearance warnings)

### Scenario & event authoring

- [ ] Scenario metadata (title, difficulty, recommended vessels)
- [ ] Deterministic environment presets
- [ ] Objectives (dock, deliver, tow, rescue, survey)
- [ ] Failure conditions (collisions, grounding, penalties, lateness)
- [ ] Scoring rules (exams, prosumer runs)
- [ ] Regions/volumes for rules and triggers
- [ ] Trigger/action system (time, region entry, incidents)

### AI traffic authoring

- [ ] Traffic spawners with schedules
- [ ] Vessel pools per spawner
- [ ] Behavior profiles (lawful, rushed, inexperienced, distressed)
- [ ] Port congestion modeling (queues, berth occupancy)

### Validation & tooling

- [ ] Depth and clearance validation tools
- [ ] Nav light visibility preview (night mode)
- [ ] AI traffic test simulation
- [ ] Measure tool (distance, bearing, depth)
- [ ] Layer panel (lock/visibility)
- [ ] Prefab library + search

### Publishing & sharing

- [ ] Versioned saves
- [ ] Export world layer packs and scenario packs
- [ ] Private sharing links
- [ ] Public listing with moderation
- [ ] Dependency tracking (assets/mods)

---

## Economy & ownership

- [ ] Costs only charged to vessel owners
- [ ] Crew pay for time/tasks + optional profit share
- [ ] Vessel creation limited by rank + currency
- [ ] Inventory/cargo system
- [ ] Vessel lifecycle (maintenance, wear, dry dock, insurance)

## Vessel classes & content

- [ ] Core vessel archetypes (transit, precision, force, vulnerable, static)
- [ ] Standard vessels (cargo, tanker, passenger, tug, small craft)
- [ ] Weird / specialized vessels
  - [ ] Icebreaker
  - [ ] Cable layer
  - [ ] Fishing vessel
  - [ ] Research vessel
  - [ ] Salvage ship
  - [ ] Heavy-lift / ship carrier
  - [ ] Sailboat
  - [ ] Rowboat
  - [ ] Fireboat
  - [ ] Buoy tender
- [ ] Static / semi-static structures as vessels
  - [ ] Oil rigs / offshore platforms
  - [ ] Wind farms
  - [ ] Floating docks / barges
  - [ ] Buoy systems as entities

## Navigation & realism

- [ ] ECDIS-lite (routes, channels, shallow warnings)
- [ ] Manual navigation modes (dead reckoning, celestial in hardcore)
- [ ] Pilotage zones + tug assistance
- [ ] Dynamic hazards (weather failures, ice, visibility effects)

## Missions, AI & progression

- [ ] Emergency missions (SAR, disabled tow, fire response)
- [ ] Competitive contracts
- [ ] Long-haul multi-leg missions
- [ ] Dynamic mission generation from world state
- [ ] Smarter AI behavior + consequences
- [ ] Licensing & certification system
- [ ] Reputation system (ports and companies)

## Modding

- [ ] Mod package support (manifest + assets)
- [ ] Server-normalized physics values
- [ ] Persisted mod installations per space
- [ ] Certification for public spaces
- [ ] Mod sharing, ratings, clone-and-mod workflow

## Analysis & community

- [ ] Post-voyage analysis tools
- [ ] Replay export and sharing
- [ ] Shipping companies (shared fleet, treasury, ranks)
- [ ] Scheduled events (convoys, storm challenges)
- [ ] Observer tools (spectator cameras + commentary)
