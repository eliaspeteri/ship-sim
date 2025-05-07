# GMDSS (Global Maritime Distress and Safety System) Features

This document tracks the detailed features for the GMDSS system in the Ship Simulator. Features are based on real-world GMDSS requirements and project goals. Checked items are implemented or present in code/UI; unchecked are pending or unclear.

## Core GMDSS Components
- [ ] DSC (Digital Selective Calling)
- [ ] NAVTEX receiver
- [ ] INMARSAT communications
- [ ] EPIRB status monitoring

## Required Work

### 1. Feature Analysis & Planning
- Break down each GMDSS component (DSC, NAVTEX, INMARSAT, EPIRB) into required features, UI, simulation logic, and integration points.
- Determine simulation depth for each: protocol simulation, UI-only, or mock data.

### 2. Implementation Tasks
- Design and implement UI panels for each GMDSS component.
- Simulate message sending/receiving, status monitoring, and alarms.
- Integrate with other systems (e.g., ECDIS, radar, alert systems) as appropriate.
- Add test cases for each feature.

### 3. Documentation
- Document features, user interactions, and simulation limitations.

## Component Feature Breakdown

### DSC (Digital Selective Calling)
- UI for channel selection, distress/urgency/safety call initiation, and message display
- Simulation of sending/receiving DSC messages (distress, urgency, safety, routine)
- MMSI input and validation
- Alarm/acknowledgment logic for incoming distress calls
- Integration with radio and alert systems

## DSC (Digital Selective Calling) Task Checklist

- [ ] Define DSC message types and data structures
- [ ] Design UI for channel selection
- [ ] Implement channel selection logic
- [ ] Design UI for distress/urgency/safety/routine call initiation  
    *Call types in DSC include:*
    - Distress: Used for immediate danger to life or vessel (MAYDAY)
    - Urgency: For urgent messages concerning safety (PAN-PAN)
    - Safety: For navigational or meteorological warnings (SECURITÉ)
    - Routine: For standard, non-emergency communication

- [ ] Implement call initiation logic for each call type  
    *Each call type requires specific message formatting, priority handling, and alarm behavior according to GMDSS standards.*

- [ ] Design UI for message display and history  
    *Display should clearly indicate call type, timestamp, sender MMSI, and message content. History should allow filtering by call type.*
- [ ] Implement message sending simulation
- [ ] Implement message receiving simulation
- [ ] Add MMSI input and validation logic
- [ ] Implement alarm and acknowledgment logic for incoming distress calls
- [ ] Integrate DSC with radio system simulation
- [ ] Integrate DSC alarms with alert systems
- [ ] Add unit tests for all logic
- [ ] Add documentation for DSC usage and simulation limitations

## NAVTEX Receiver
- UI for displaying received messages (navigational warnings, weather forecasts, SAR info)
- Simulation of scheduled message reception and message filtering by station/subject
- Message storage and retrieval
- Integration with voyage planning and alert systems

## NAVTEX Receiver Task Checklist

- [ ] Define NAVTEX message types and data structures
- [ ] Design UI for message display (navigational warnings, weather, SAR info)
- [ ] Implement message display and filtering by station/subject
- [ ] Simulate scheduled message reception
- [ ] Implement message storage and retrieval logic
- [ ] Integrate NAVTEX alerts with voyage planning and alert systems
- [ ] Add unit tests for NAVTEX logic
- [ ] Add documentation for NAVTEX usage and simulation limitations

## INMARSAT Communications
- UI for sending/receiving safety and routine messages (text/email style)
- Simulation of satellite link status (connected/disconnected, signal strength)
- Distress alerting and acknowledgment
- Integration with other bridge systems for message routing

## INMARSAT Communications Task Checklist

- [ ] Define INMARSAT message types and data structures
- [ ] Design UI for sending/receiving safety and routine messages
- [ ] Implement message sending and receiving logic
- [ ] Simulate satellite link status (connected/disconnected, signal strength)
- [ ] Implement distress alerting and acknowledgment logic
- [ ] Integrate INMARSAT with other bridge systems for message routing
- [ ] Add unit tests for INMARSAT logic
- [ ] Add documentation for INMARSAT usage and simulation limitations

## EPIRB Status Monitoring
- UI for EPIRB status (armed, activated, battery, test)
- Simulation of manual/automatic activation and distress signal transmission
- Alarm and status indication on bridge
- Integration with alert and monitoring systems

## EPIRB Status Monitoring Task Checklist

- [ ] Define EPIRB status and event data structures
- [ ] Design UI for EPIRB status (armed, activated, battery, test)
- [ ] Implement manual and automatic activation logic
- [ ] Simulate distress signal transmission
- [ ] Implement alarm and status indication on bridge
- [ ] Integrate EPIRB with alert and monitoring systems
- [ ] Add unit tests for EPIRB logic
- [ ] Add documentation for EPIRB usage and simulation limitations

## Implementation Notes
- Each component should simulate realistic user interaction, message flow, and system status where possible.
- Integration with other bridge systems (e.g., ECDIS, radar, alert systems) is recommended for a complete simulation experience.
- UI panels, alarms, and test cases should be developed for each feature.

---

**Legend:**
- [x] Implemented or present in code/UI
- [ ] Not yet implemented or unclear

*This list is updated as of May 2025. Please update as features are added or clarified.*
