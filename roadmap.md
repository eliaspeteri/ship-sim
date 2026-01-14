# Roadmap TODOs

## Core access & social

- [x] Roles & permissions (Guest / Spectator / Player / Admin)
- [x] Spectator mode + Player mode + robust switching
- [x] Vessel join/create UX (crew slots, spawn picker, chat replay)
- [x] Global chat + vessel-local chat
- [x] Spaces (public/private, invites, manage my spaces, scenarios/tutorial spaces)
- [x] Shared layout/navbar + HUD overhaul + mobile landscape mode

---

## Environment & world simulation

- [x] Server-driven weather per space + persisted state
- [x] Server-driven day/night cycle + local time from lat/lon
- [x] Timed events triggering environment presets
- [x] Tide system (Earth-data-driven, regional or global)
- [ ] Ice systems (freeze-over, drift ice, vessel immobilization)
- [ ] Seasonal variation (weather, daylight, port accessibility)

---

## Vessel control & bridge systems

- [x] Ballast controls + feedback/state
- [x] Crew roles to avoid control conflicts (helm/engine/radio)
- [x] Admin reposition tools
- [x] AIS overlay + dual-band radar views
- [ ] Advanced bridge equipment (ECDIS-lite, echo sounder, conning display)
- [ ] Pilot transfer mechanics (boarding zones, vessel-to-vessel transfer)

---

## Observability & performance

- [x] Metrics endpoint + socket latency sampling + centralized logs
- [x] Performance budgets (60 Hz sim + smooth rendering)
- [x] Server health dashboards per space

---

## Persistence & auth

- [x] Postgres + Prisma persistence (users, vessels, environment, bans/mutes, chat)
- [x] Migrations/seed + backup/restore
- [x] NextAuth review + hardening
- [x] Frontend tests (unit + smoke e2e)
- [ ] Long-term audit logs (economy, ruleset changes, vessel lifecycle)

---

## Core simulation

- [x] Replay/ghost mode + quick-start scenarios + AI pilot takeover
- [x] Globe/ocean rendering from Earth tiles + bathymetry grounding
- [x] Physics realism upgrades (hydro constants, waves, hull form/buoyancy)
- [x] Mission system + basic economy (costs, fuel, port fees, earnings)
- [ ] Failure modeling (engine, steering, flooding)
- [x] Damage persistence and repair workflows

---

## Rulesets & fairness (space policy + assists + realism)

### Ruleset fundamentals

- [ ] Ruleset is a first-class space setting
- [ ] Ruleset controls:
  - [ ] Assists (stability, autopilot, docking helpers)
  - [ ] Realism toggles (damage, wear, failures)
  - [ ] Enforcement (COLREG penalties, investigations)
  - [ ] HUD limitations
  - [ ] Allowed vessel/mod definitions
  - [ ] Progression and scoring behavior

### Built-in rulesets

- [ ] CASUAL_PUBLIC

  - [ ] Free leave/teleport allowed
  - [ ] Soft collisions
  - [ ] Generous insurance & loans
  - [ ] Minimal penalties
  - [ ] AI handles failures automatically

- [ ] SIM_PUBLIC

  - [ ] Leaving only in port / via transfer
  - [ ] Damage, towing, SAR required
  - [ ] COLREG enforcement
  - [ ] Insurance & loans meaningful
  - [ ] Higher rewards for clean ops

- [ ] PRIVATE_SANDBOX

  - [ ] Host-controlled realism
  - [ ] Mods unrestricted
  - [ ] Progression optional

- [ ] TRAINING_EXAM
  - [ ] Deterministic scenarios
  - [ ] Fixed vessel/loadout
  - [ ] Scored with replay + violations
  - [ ] Used for licenses/certifications

### Ruleset UX

- [x] Ruleset badges in server browser
- [x] Assist disclosure + run tagging
- [ ] Ruleset migration warnings
- [x] Ruleset change audit logs

---

## Map editor (layer-based, Earth-data-backed)

### Base assumptions

- [x] Terrain + bathymetry from Earth tile servers (read-only)
- [ ] Overlay-only editing (no sculpting)
- [ ] Tile-aligned streaming + LOD

### Decor & atmosphere

- [ ] Vegetation & biome painting
- [ ] Natural clutter (rocks, shoreline props)
- [ ] Man-made clutter (fences, containers, signage)
- [ ] No-decoration masks

### Structures & clearance

- [ ] Bridges with clearance metadata
- [ ] Overhead cables & pipelines
- [ ] Towers, masts, chimneys
- [ ] Clearance zones

### Ports & infrastructure

- [ ] Port definitions (name, region, metadata)
- [ ] Berths, docks, moorings, anchorages
- [ ] Port services metadata (fuel, repair, tugs, pilots)
- [ ] Passenger terminals and ferry docks

### Navigation aids & constraints

- [ ] Buoys, beacons, lighthouses
- [ ] Speed limit zones
- [ ] Restricted / exclusion zones
- [ ] Clearance and depth constraints

---

## Economy & ownership

- [ ] Vessel creation cost (rank + currency gated)
- [ ] Operating costs apply while underway (even offline)
- [ ] Idle, drifting, and underway cost models
- [ ] Crew wages and/or revenue share (locked per voyage)
- [ ] Loans and central banking system
- [ ] Insurance (loss, damage, salvage)
- [ ] Vessel storage in dock (zero operating cost)
- [ ] Auctions, repossession, voluntary sales
- [ ] Leasing and chartering
- [ ] Cargo ownership and liability

---

## Cargo, passengers & logistics

- [ ] Procedural cargo generation by port size and region
- [ ] Cargo expiration and rerouting
- [ ] Competition balanced by availability, not scarcity
- [ ] Small-craft cargo (fish, parcels, supplies)
- [ ] Passenger (pax) operations
  - [ ] Ferries
  - [ ] Water buses
  - [ ] Water taxis
- [ ] Port congestion effects on turnaround

---

## Careers & progression

- [ ] Career paths (cargo, pax, SAR, salvage, pilotage, tug, survey)
- [ ] Licensing and certification system
- [ ] Exams and deterministic training scenarios
- [ ] License expiration and renewal rules
- [ ] Reputation system (ports, companies, regions)
- [ ] Multi-career support and mixed fleets

---

## Vessels & structures

- [ ] Core vessel archetypes (transit, precision, force, vulnerable, static)
- [ ] Standard vessels (cargo, tanker, ferry, tug, small craft)
- [ ] Specialized vessels (icebreaker, research, salvage, cable layer)
- [ ] Static/semi-static structures as vessels
  - [ ] Oil platforms
  - [ ] Floating docks
  - [ ] Wind farms
  - [ ] Buoy systems

---

## Missions, AI & world population

- [ ] Dynamic mission generation from world state
- [ ] AI baseline traffic and services
- [ ] AI as service fallback, not competitor
- [ ] Player-preferred contracts over AI
- [ ] SAR, tug, pilot, and emergency workflows
- [ ] Crew rescue and abandonment mechanics (ruleset-dependent)

---

## Travel & world scale

- [ ] Abstracted inter-region travel (port-to-port)
- [ ] Cooldowns and costs for fast travel
- [ ] Region discovery incentives
- [ ] Inland waterways and river systems

---

## Modding

- [ ] Mod package support (manifest + assets)
- [ ] Server-normalized physics values
- [ ] Mod certification for public spaces
- [ ] Private modded spaces
- [ ] Asset dependency tracking

---

## Analysis & community

- [ ] Post-voyage analysis tools
- [ ] Replay export and sharing
- [ ] Shipping companies (shared fleets and treasuries)
- [ ] Auctions and broker gameplay
- [ ] Scheduled world events
- [ ] Observer tools (spectator cameras + commentary)
