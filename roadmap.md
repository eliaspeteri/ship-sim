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
- [ ] Tide system (Earth-data-driven, regional or global)
- [ ] Seasonal effects (ice formation, freeze-up, thaw)
- [ ] Ice mechanics (hull resistance, immobilization, overwintering)

---

## Vessel control & bridge systems

- [x] Ballast controls + feedback/state
- [x] Crew roles to avoid control conflicts (helm/engine/radio)
- [x] Admin reposition tools
- [x] AIS overlay + dual-band radar views
- [ ] Crew transfer mechanics (ladder, boat, heli later)
- [ ] Pilot boarding mechanics
- [ ] Emergency abandonment & evacuation mechanics

---

## Observability & performance

- [x] Metrics endpoint + socket latency sampling + centralized logs
- [x] Performance budgets (60 Hz sim + smooth rendering)

---

## Persistence & auth

- [x] Postgres + Prisma persistence (users, vessels, environment, bans/mutes, chat)
- [x] Migrations/seed + backup/restore
- [x] NextAuth review + hardening
- [x] Frontend tests (unit + smoke e2e)

---

## Core simulation

- [x] Replay/ghost mode + quick-start scenarios + AI pilot takeover
- [x] Globe/ocean rendering from Earth tiles + bathymetry grounding
- [x] Physics realism upgrades (hydro constants, waves, hull form/buoyancy)
- [x] Mission system + basic economy (costs, fuel, port fees, earnings)

---

## Rulesets & realism policy

### Ruleset fundamentals

- [ ] Ruleset is a first-class space setting
- [ ] Ruleset controls:
  - [ ] Assist levels (stability, docking, autopilot)
  - [ ] Realism toggles (damage, wear, failures)
  - [ ] Enforcement (COLREGs, speed limits, investigations)
  - [ ] HUD limitations (camera modes, overlays)
  - [ ] Economy strictness (insurance, loans, repossession)
  - [ ] Allowed vessels/mods
  - [ ] Scoring & progression

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

- [ ] Space browser badges (ruleset, assists, mods, licenses)
- [ ] Space creation preview panel
- [ ] Ruleset change audit log

---

## Map editor (overlay-based, Earth-backed)

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

- [ ] Port definitions (size, rules, services)
- [ ] Docks / berths (length, depth)
- [ ] Mooring points
- [ ] Anchorages
- [ ] Port services metadata (fuel, repair, tugs)

### Navigation aids

- [ ] Buoys (IALA A/B)
- [ ] Beacons & daymarks
- [ ] Lighthouses & sector lights
- [ ] Leading lines

### Zones & constraints

- [ ] Speed limits
- [ ] Restricted zones
- [ ] Environmental zones
- [ ] No-anchoring zones

### Routing & AI traffic

- [ ] Spawn points
- [ ] Route authoring & validation
- [ ] AI traffic schedules
- [ ] Congestion modeling

### Scenarios & events

- [ ] Objectives & failure conditions
- [ ] Triggers & actions
- [ ] Deterministic exams

### Tooling & publishing

- [ ] Validation tools
- [ ] Measure tools
- [ ] Layer panel
- [ ] Export/share packs

---

## Economy & ownership

### Entry & recovery

- [ ] Vessel creation costs (scaled by class)
- [ ] Starter balance allows one failure
- [ ] Charter system (temporary vessels)
- [ ] Always-available AI employment
- [ ] Join other players’ vessels for income

### Operating economy

- [ ] Costs charged only to owners
- [ ] Underway costs apply even at zero throttle
- [ ] Idle/storage reduces or halts costs
- [ ] Port fees on entry

### Crew compensation

- [ ] Fixed wage contracts
- [ ] Revenue-share contracts
  - [ ] Locked per voyage
  - [ ] Negotiated pre-departure
  - [ ] Forfeited if leaving early

### Loans & insurance

- [ ] Central bank loan system
- [ ] Loan eligibility based on rank/rep/history
- [ ] Insurance tiers (none/basic/premium)
- [ ] Insurance only purchasable in port

### Vessel lifecycle

- [ ] Active
- [ ] Stored / dry dock (no operating cost)
- [ ] Abandoned
- [ ] Impounded
- [ ] Auctioned
- [ ] Written off / salvaged

### Markets

- [ ] Public auctions (repos, damaged ships)
- [ ] Player-listed sales
- [ ] Leasing system
- [ ] Emergent broker gameplay

---

## Cargo & logistics

- [ ] World-driven cargo generation
- [ ] Rolling backlog per port
- [ ] Cargo tied to port size, region, season
- [ ] Big ports: high volume, high competition
- [ ] Small ports/piers: low volume, high reliability
- [ ] Cargo supports all vessel scales
- [ ] Passenger (PAX) cargo support

---

## Vessel classes & content

- [ ] Core archetypes
  - Transit
  - Precision
  - Force
  - Vulnerable
  - Static / semi-static
- [ ] Standard vessels (cargo, tanker, ferry, tug)
- [ ] Small craft & starters (motorboats, water taxis)
- [ ] Passenger ops
  - Water taxis
  - Ferries
  - River buses
- [ ] Weird / specialized vessels
  - Icebreaker
  - Cable layer
  - Fishing vessel
  - Research vessel
  - Salvage ship
  - Heavy-lift / ship carrier
  - Fireboat
  - Buoy tender
- [ ] Static/semi-static entities
  - Oil rigs
  - Wind farms
  - Floating docks

---

## Navigation & realism

- [ ] ECDIS-lite
- [ ] Manual navigation modes
- [ ] Pilotage zones
- [ ] Tug-assisted maneuvers
- [ ] Dynamic hazards (ice, fog, storms)

---

## Missions, AI & world population

- [ ] Emergency missions (SAR, fire, tow)
- [ ] Passenger schedules
- [ ] Competitive contracts
- [ ] Long-haul voyages
- [ ] Dynamic mission generation
- [ ] AI vessels populate lanes & carry cargo
- [ ] AI causes incidents & congestion
- [ ] AI provides baseline services everywhere

---

## Crew, careers & progression

- [ ] Crew states (onboard, offboard, distressed)
- [ ] SAR-generated rescue gameplay
- [ ] Career paths (tug, ferry, salvage, offshore, pilot)
- [ ] Career switching without hard lock-in
- [ ] Mixed fleets per player/company
- [ ] Licensing & certification system
- [ ] License renewal / refresh exams
- [ ] Reputation with ports, insurers, banks

---

## Modding

- [ ] Mod packages (manifest + assets)
- [ ] Server-normalized physics
- [ ] Mod persistence per space
- [ ] Certification for public spaces
- [ ] Mod sharing, ratings, clone-and-mod workflow

---

## Analysis & community

- [ ] Post-voyage analysis
- [ ] Incident review & playback
- [ ] Replay export & sharing
- [ ] Shipping companies (shared fleets, treasury)
- [ ] Scheduled events (convoys, storms)
- [ ] Observer & commentary tools
