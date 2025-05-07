# ECDIS (Electronic Chart Display) Features

This document tracks the detailed features for the ECDIS system in the Ship Simulator. Features are based on real-world ECDIS systems (e.g., Furuno) and project goals. Checked items are implemented or present in code/UI; unchecked are pending or unclear.

## Core Chart Display
- [x] Pan and zoom controls
- [x] Dynamic ship position updates (live or mock movement)
- [x] Cursor lat/lon readout overlay
- [x] Chart layer toggles (coastline, buoys, route)
- [x] Waypoint/route editing (add, move, delete)
- [x] AIS/target overlays (mock or real)
- [x] Chart scale bar and north arrow
- [x] Info popups (tooltips) for buoys, waypoints, AIS targets
- [x] Chart layer management (multiple chart types, opacity, ordering)
- [x] Chart object search & highlight (waypoints, buoys, AIS)
- [x] Measurement tools (distance, bearing, area)
- [ ] Route export/import (JSON/CSV/GPX)
- [ ] Route leg info (distance, bearing, ETA)
- [ ] Safety features (contours, CPA/TCPA, guard zones)
- [ ] Weather/environment overlays
- [ ] Radar overlay integration
- [ ] Undo/redo for route editing
- [ ] Print/export chart view as image
- [ ] Customizable color schemes (night/day mode)
- [ ] Context menu on right-click
- [ ] Minimap/overview window
- [ ] Smooth transitions/animations for zoom and pan
- [ ] ENC/Vector chart support (S-57/S-101)
- [ ] Raster chart support (e.g., BSB/KAP)
- [ ] Chart datum and projection management
- [ ] ENC update management

## Navigation & Monitoring
- [ ] Route monitoring (active leg, cross-track error, ETA)
- [ ] Safety contour and depth area display
- [ ] Alarms and warnings (shallow water, CPA/TCPA, system alerts)
- [ ] Guard zones and safety circles
- [ ] Own ship symbol with heading and COG/SOG vectors
- [ ] North-up, course-up, and head-up display modes
- [ ] Range rings and bearing lines
- [ ] Compass rose overlay
- [ ] Scale and zoom level indicator

## Integration & Overlays
- [ ] Radar overlay (real or simulated)
- [ ] AIS integration (real or simulated)
- [ ] Bathymetric and land overlays
- [ ] Weather overlays (wind, pressure, precipitation)
- [ ] Sensor status overlays (GPS, gyro, etc.)

## User Interface & Usability
- [ ] Customizable UI panels and widgets
- [ ] Touch and mouse interaction support
- [ ] Multi-language support
- [ ] Help and documentation integration
- [ ] User profiles and settings

---

**Legend:**
- [x] Implemented or present in code/UI
- [ ] Not yet implemented or unclear

*This list is updated as of May 2025. Please update as features are added or clarified.*
