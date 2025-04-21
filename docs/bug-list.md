- [x] Simulation time is shown as NaN:NaN:NaN.
- [x] Simulation time is not advancing when the simulation is running.
- [ ] Dashboard is below the canvas. Should be reworked to be on top of the canvas.
- [ ] Gauges are on top of each other in the dashboard.
- [-] Vessel controls are missing. Dashboard only has text "Throttle" and "Rudder".
- [ ] Engine isn't running even when turning it on from "start engine" button.
- [ ] Machinery controls lays pipe schematics on top of the canvas.
- [ ] Pump controls are working, but they're toggled by clicking a text. They should be toggled from a button.
- [x] Events are stored, but they're listed for example as "Invalid Date	Engine started". They're missing the event time.
- [x] Events are logged with time as "2:00:00 AM" and it never changes. It should use the simulation time.
- [x] Events are logged with format "1745077455261	Simulation paused". Timestamp should be formatted to be human readable.
- [ ] Dashboard shows gauges in a single column. UI should be reworked to represent the gauges more visually. Gauges should be grouped in relation to each other, and what they represent. Controls should be grouped with common gauges. For example coolant pump controls should be grouped with coolant pump gauges.
- [ ] The ocean doesn't respond to the set environment. The ocean is always calm.
- [x] Stop engine button doesn't work in the machinery controls.
- [x] Start engine button doesn't work in the machinery controls.
- [x] If I have the machinery controls open, and I start the engine from engine controls, and then I stop the engine from the machinery controls, I get an error "TypeError: this.wasmExports.setBallast is not a function". It's happening in "src\simulation\simulationLoop.ts (263:24) @ applyControls".
- [x] The "fuel pump failure" button causes continuous event logging about the failure. I also get the following error in browser console tons of times:
```
Uncaught TypeError: vessel.controls is undefined
    useEffect webpack-internal:///(pages-dir-browser)/./src/components/MachineryPanel.tsx:591
    setTimeout handler*MachineryPanel.useEffect webpack-internal:///(pages-dir-browser)/./src/components/MachineryPanel.tsx:587
    React 5
index.js line 6602 > eval:591:29
```
- [x] Performance issues when the simulation is running.
- [ ] Day-night cycle is not working. The sun is always in the same position.
- [ ] Precipitation is missing.
- [ ] No button for start air valve.
- [x] Tab crashing occasionally. Need to reproduce. Was playing with engine controls, starting and stopping the engine. Perhaps tab ran out of memory too.
- [x] Update `assembly/index.ts` to remove default parameters from the `updateVesselState` function declaration and handle undefined values inside the function.
- [ ] Missing error boundaries in the app.
