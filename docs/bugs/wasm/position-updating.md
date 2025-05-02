Related files:
- `src/lib/wasmBridge.ts`
- `src/lib/customWasmLoader.ts`
- `src/simulation/simulationLoop.ts`
- `assembly/index.ts`
- `assembly/index.test.ts`

Whenever the sim starts, the following things happen:
- Speed increases uncontrollably to thousands of knots
- Position x fluctuates between negative thousands and positive thousands
- Position y decreases uncontrollably to negative thousands
- Course fluctuates between 0 and 114 degrees.
- Pitch and roll are not affected
- Pitch and roll animations are applied. Most likely they're calculated on the frontend and not in the wasm.

## Test cases

Tests pass successfully. Running `npm run astest` gives following results:
```
test case: 99/99 (success/total)

-----------|---------|----------|---------|--------
File       | % Stmts | % Branch | % Funcs | % Lines
-----------|---------|----------|---------|--------
assembly   | 99.2    | 92.86    | 97.56   | 99.2  

  add.ts   | 100     | 100      | 100     | 100   

  index.ts | 99.19   | 92.86    | 97.5    | 99.19 

-----------|---------|----------|---------|--------
```

## Previous attempts

Previous attempts at fixing this issue have added max caps to several variables such as speed, position, and course. However, these caps are not an actual solution to the problem. They only mask the underlying issue, which is that the simulation is not correctly updating the vessel's state.
To me it seems like there's a runaway calculation somewhere. For example some value is getting multiplied exponentially.

## Magic numbers

There's also multiple unexplained magic numbers in `assembly/index.ts`. These should be lifted into constants with descriptive names or removed entirely. For example in `updateVesselState` there's this block of code:
```typescript
  // Define added mass factors for acceleration calculations
  const massSurge = vessel.mass * 1.1;
  const massSway = vessel.mass * 1.6;
  const massHeave = vessel.mass * 1.2;
  const inertiaRoll = vessel.Ixx * 1.1;
  const inertiaPitch = vessel.Iyy * 1.1;
  const inertiaYaw = vessel.Izz * 1.2;
```

## localStorage object

It doesn't seem that the environment is the problem. It's happening even in calm weather. See the localStorage object below:

```json
{
    "state": {
        "vessel": {
            "properties": {
                "name": "MV Explorer",
                "type": "CONTAINER",
                "mass": 50000,
                "length": 200,
                "beam": 32,
                "draft": 12,
                "blockCoefficient": 0.8,
                "maxSpeed": 25
            },
            "engineState": {
                "rpm": 0,
                "fuelLevel": null,
                "fuelConsumption": null,
                "temperature": 25,
                "oilPressure": 5,
                "load": 0,
                "running": false,
                "hours": 0
            }
        },
        "navigation": {
            "route": {
                "waypoints": [],
                "currentWaypoint": -1
            }
        },
        "simulation": {
            "elapsedTime": 4072.47950000028
        },
        "environment": {
            "wind": {
                "speed": 0.7982179310232517,
                "direction": 1.7074471207556612,
                "gusting": false,
                "gustFactor": 1.5
            },
            "current": {
                "speed": 0.5,
                "direction": 0.7853981633974483,
                "variability": 0.1
            },
            "seaState": 1,
            "waveHeight": 0.1,
            "waveDirection": 1.7073149584059102,
            "visibility": 10
        }
    },
    "version": 0
}
```
Some things to note:
- fuel level and fuel consumption are null.

## Unreachable executed error

After running the sim for some time, this stack trace comes up in the browser console repeatedly:

```
10:29:12.227 Error in WASM updateVesselState: RuntimeError: unreachable executed
    updateVesselState webpack-internal:///(pages-dir-browser)/./src/lib/customWasmLoader.ts:111
    updateVesselState webpack-internal:///(pages-dir-browser)/./src/lib/wasmBridge.ts:46
    updatePhysics webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:118
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:88
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    loop webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
    animationFrameId webpack-internal:///(pages-dir-browser)/./src/simulation/simulationLoop.ts:101
<anonymous code>:1:145535
```
it seems to be coming from here: `src\lib\customWasmLoader.ts (160:18) @ updateVesselState`. At this point, the simulation has been running for an hour. Refreshing the page reloads the sim state, and returns to normal.

## Vessel state

Logging the entire vessel state from store in `Dashboard.tsx` returns this:
```json
{
  "properties": {
    "name": "MV Explorer",
    "type": "CONTAINER",
    "mass": 50000,
    "length": 200,
    "beam": 32,
    "draft": 12,
    "blockCoefficient": 0.8,
    "maxSpeed": 25
  },
  "engineState": {
    "rpm": 0,
    "fuelLevel": null,
    "fuelConsumption": null,
    "temperature": 25,
    "oilPressure": 5,
    "load": 0,
    "running": false,
    "hours": 0
  },
  "position": {
    "x": -770.2143719165148,
    "y": -2619.237289390328,
    "z": 0
  },
  "orientation": {
    "heading": 1.4058206419362924,
    "roll": null,
    "pitch": null
  },
  "velocity": {
    "surge": 3772.8751573774443,
    "sway": 0,
    "heave": 0
  },
  "stability": {
    "metacentricHeight": null,
    "centerOfGravity": {
      "x": 0,
      "y": null,
      "z": 6
    },
    "trim": 0,
    "list": 0
  }
}
```
There's also some null values in the state such as `roll`, `pitch`, `sway`, `heave`, `metacentricHeight`, and `centerOfGravity.y`.

👆 `sway` and `heave` are now updated correctly into the state but it doesn't seem like they're calculated correctly.

`metacentricHeight` and `centerOfGravity.y` are still not updated correctly. They're always null. There's some checks againsn't this in `simulationLoop` but they only seem to log out errors once the tab loses focus. On sim init, they're not logged out.

```ts
// Check for NaN values which indicate a problem with the WASM vessel state
if (isNaN(x) || isNaN(y) || isNaN(z)) {
console.error('WASM vessel position contains NaN values:', {
x,
y,
z,
});
} else {
// Valid position values - update store
state.updateVessel({ position: { x, y, z } });
}
```

## Checking the WASM exports (fixed)

Running `npm run wasm:check-exports` gives the following output:
```
======== DEBUG WASM ANALYSIS ========
Total exports: 25
User-defined exports: 25

Exported functions:
  - calculateWaveHeight
  - calculateBeaufortScale
  - calculateWaveHeightAtPosition
  - updateVesselState
  - createVessel
  - setThrottle
  - setWaveData
  - setRudderAngle
  - setBallast
  - getWaveHeight
  - getWaveFrequency
  - getVesselWaveHeight
  - getVesselWavePhase
  - getVesselRollAngle
  - getVesselPitchAngle
  - getVesselX
  - getVesselY
  - getVesselZ
  - getVesselHeading
  - getVesselSpeed
  - getVesselEngineRPM
  - getVesselFuelLevel
  - getVesselFuelConsumption
  - getVesselGM
  - getVesselCenterOfGravityY

⚠️  MISSING EXPORTS (3):
  - getWaveHeightForSeaState
  - calculateWaveLength
  - calculateWaveFrequency

Unexpected exports (5):
  - calculateWaveHeight
  - getWaveHeight
  - getWaveFrequency
  - getVesselWaveHeight
  - getVesselWavePhase

Analyzing release build: E:\IDrive-Backup\code\github\web\ship-sim\public\wasm\ship_sim.wasm

======== RELEASE WASM ANALYSIS ========       
Total exports: 23
User-defined exports: 23

Exported functions:
  - calculateWaveFrequency
  - getWaveHeightForSeaState
  - calculateBeaufortScale
  - calculateWaveLength
  - calculateWaveHeightAtPosition
  - updateVesselState
  - createVessel
  - setThrottle
  - setWaveData
  - setRudderAngle
  - setBallast
  - getVesselRollAngle
  - getVesselPitchAngle
  - getVesselX
  - getVesselY
  - getVesselZ
  - getVesselHeading
  - getVesselSpeed
  - getVesselEngineRPM
  - getVesselFuelLevel
  - getVesselFuelConsumption
  - getVesselGM
  - getVesselCenterOfGravityY

✅ All expected functions are exported.        

⚠️  EXPORT ISSUES DETECTED

Possible causes:
1. Functions with default parameters (not supported by AssemblyScript exports)
2. Functions returning complex types like arrays
3. Functions optimized out during compilation 

Recommended fixes:
1. Remove default parameters from exported functions
2. Add @external JSDoc annotation to exported 
functions
3. Use simpler return types for exported functions
```
The dev frontend uses the debug build so there might be some missing exports. The release build seems to be fine. The missing exports are:
- `getWaveHeightForSeaState`
- `calculateWaveLength`
- `calculateWaveFrequency`
The unexpected exports are:
- `calculateWaveHeight`
- `getWaveHeight`
- `getWaveFrequency`
- `getVesselWaveHeight`
- `getVesselWavePhase`
Should investigate why the missing exports are missing. The unexpected exports are no longer found in the assemblyscript code. Checking the file explorer, the build files are updated. The latest update time for the wasm output file matches when the last build was run.

Should check the `check-wasm-exports.ts` script itself to validate that it runs correctly.

👆 This was fixed by updating the path the script looks into for the debug build of wasm. It was updated at some point to point into the public folder instead of build folder.

## Missing counteracting forces?

If there should be counteracting forces on the vessel, make sure these are applied correctly.

## Custom fallback code

There's some custom code in `src/lib/wasmBridge.ts`. The frontend should rely as much on the wasm module as possible. From what I recall, the custom code was added as a fallback for when some wasm functions were not exported correctly.

In the simulationLoop there's a private method called `loop`. It calls methods such as `updateUIFromPhysics`, `updatePhysics` and `updateWaveProperties`. These should be verified, that they work as intended.
`updatePhysics` in particular seems to be called conditionally if `accumulatedTime` is greater than or equal to `fixedTimeStep` Why?

```ts
// Run fixed timestep physics updates
while (this.accumulatedTime >= this.fixedTimeStep) {
this.updatePhysics(this.fixedTimeStep);
this.accumulatedTime -= this.fixedTimeStep;
}
```

## Vessel position not saved correctly

Position is also not saved correctly on page refresh. Vessel always starts from 0,0,0.

## Multiple getters for vessel speed?

There are now two getter functions for the vessel speed.
`getVesselSpeed` and `getVesselSurge`:
```ts
/**
 * Gets the vessel's speed (magnitude of velocity).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The vessel's speed in m/s
 * @external
 */
export function getVesselSpeed(vesselPtr: usize): f64 {
  const vessel = changetype<VesselState>(vesselPtr);
  return Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
}
```

```ts
/**
 * Gets the vessel's surge velocity (u).
 * @param vesselPtr - Pointer to the vessel instance
 */
export function getVesselSurgeVelocity(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).u;
}
```
