# Ship Simulator Features

This document tracks the major features of the Ship Simulator project, grouped as in the README. Features that are implemented or have clear code evidence are checked. Others are left unchecked. This list is based on code, bug reports, and project structure as of April 2025. If a feature's status is unclear, please confirm or update as needed.

## Physics Simulation Core
- [x] Hydrodynamics
  - [x] Hull resistance
  - [x] Wave interaction
  - [x] Maneuvering forces
- [x] Propulsion
  - [x] Engine models
  - [x] Propeller curves
  - [x] Shaft dynamics
- [x] Environmental Effects
  - [x] Wind forces
  - [x] Current effects
  - [ ] Sea state simulation
  - [ ] Weather effects
- [x] Mass & Stability
  - [x] Ballast
  - [x] Cargo
  - [x] Fuel consumption
  - [x] Trim & list calculations
- [x] Real-time Simulation
  - [x] Continuous time-stepping
  - [x] Event-driven simulation
  - [x] Real-time data visualization

## 3D Graphics with WebGL and Three.js
- [x] Vessel Model: Detailed 3D model of the ship
- [x] Environment: Realistic ocean and weather simulation, ports
    - [ ] Bathymetric data. Supplied for example from GEBCO, SRTM30_PLUS and ETOPO1
    - [ ] Land data. Supplied with SRTM. Does not need to cover the entire world, just the area around the water bodies.
    - [ ] Realtime weather from online.
- [x] Camera Controls: Bridge view, external view, machinery spaces

## UI
- [x] Control panels: Telegraph, bridge controls, system monitors
  - [x] Rudder control lever
  - [x] Telegraph lever
  - [x] Ball Valve
  - [x] Rotary Valve
  - [ ] Pump
  - [x] Push button
  - [x] Switch
  - [x] Dial
  - [ ] Radio
  - [ ] Telex
- [x] Gauges & Indicators: RPM, temperature, pressure, fuel levels, alarms
  - [x] Machine gauge
  - [x] Circular gauge
  - [x] Compass rose
  - [x] Thermometer
  - [ ] Tank
  - [x] Alarm Indicator
  - [x] Inclinometer
  - [x] Basic depth sounder
  - [x] Barometer
  - [x] Wind indicator (anemometer/wind vane)
  - [x] Rudder angle indicator
- [ ] Interactive Diagrams: System schematics, flow diagrams
- [x] Logs & Reports: Event logs, fuel consumption, voyage data

## Simulation Scenarios
- [x] Normal Operations
  - [x] Start/stop engine
  - [x] Maneuvering
  - [ ] Docking
- [x] Failures & Emergency
  - [x] Breakdowns
  - [ ] Fire
  - [ ] Flooding
  - [x] Blackouts

## Data & Extensibility
- [x] Configurable vessel data: Different ship types, engine models, cargo
- [x] Save/Load State
- [ ] Modding

---

**Legend:**
- [x] Implemented or present in code/UI
- [ ] Not yet implemented or unclear

*This list is updated as of May 2025. Please update if you implement new features or clarify existing ones.*
