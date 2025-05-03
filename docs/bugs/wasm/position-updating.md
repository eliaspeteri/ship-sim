Related files:
- `assembly/index.ts`
- `assembly/*.test.ts`
- `src/lib/wasmBridge.ts`
- `src/lib/customWasmLoader.ts`
- `src/simulation/simulationLoop.ts`
- `src/store/index.ts`

Whenever the sim starts, the following things happen:
- Speed increases uncontrollably to thousands of knots
- Position x fluctuates between negative thousands and positive thousands
- Position y decreases uncontrollably to negative thousands
- Course fluctuates between 0 and 114 degrees.
- Pitch and roll are not affected (fixed)
- Pitch and roll animations are applied. Most likely they're calculated on the frontend and not in the wasm.

👆 These are now fixed, but as a result, the vessel isn't moving anywhere. They were fixed by adding isFinite checks into `updateVesselState` in `assembly/index.ts`.

👆 Back to original issue again. Position x decreases to thousands, while position y increases to thousands at the same rate. Speed decreases into the negatives (backwards direction?) into the thousands. Course is no longer fluctuating.

Not sure if coincidence, the vessel course seems to match wind direction. Although after a while the wind direction inreases but the vessel course stays the same.

## Zustand store

Vessel state is stored in a Zustand store. The store keeps track of the WASM pointer from the module. If the page is refreshed with localStorage, the vessel is recreated with the same pointer.
If the vessel is re-created on focus loss, it will use the current store state, which could have drifted.
AI sees two paths here:
1. Check and clamp velocity and throttle to safe values on vessel recreation. What are safe values and how to determine them? I'm also not sure if this is the right approach. We shouldn't artificially limit the simulation. We should fix the underlying issue.
2. Add a "reset vessel" action that sets all relevant state to zero.

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

_Update_

Now there's two failing test cases:

test case: 117/119 (success/total)

Error Message: 
        vessel position updates correctly when moving forward:
                assembly/index.test.ts:71:2     value: -638.3565936907409       expect:  > 0.00000422136422136422
        vessel moves when throttle applied:
                assembly/index.test.ts:339:2    value: -658.8227719022334       expect:  > 0.0
----------------------|---------|----------|---------|--------
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
assembly              | 95.28   | 76.21    | 98.18   | 95.28  
  config.ts           | 100     | 100      | 100     | 100    
  add.ts              | 100     | 100      | 100     | 100    
  index.ts            | 95.27   | 76.21    | 98.15   | 95.27  
assembly/util         | 100     | 100      | 100     | 100    
  test-vessel.util.ts | 100     | 100      | 100     | 100    
----------------------|---------|----------|---------|--------

Test Failed

Also branch coverage has decreased drastically.

_Update_

Some more tests are failing:

test case: 114/120 (success/total)

Error Message: 
        setThrottle changes engine RPM and fuel consumption:
                assembly/controls.test.ts:59:2  value: 1200.0   expect:  closeTo 0.0
        setBallast affects vessel stability:
                assembly/controls.test.ts:96:2  value: 2.1046527724460226       expect:  closeTo 1.8424072251534625
        vessel position updates correctly when moving forward:
                assembly/index.test.ts:71:2     value: -638.3565936907409       expect:  > 0.00000422136422136422
        updateVesselState clamps ballast level to [0, 1]:
                assembly/index.test.ts:324:2    value: 0.5      expect:  closeTo 1.0
                assembly/index.test.ts:327:2    value: 0.5      expect:  closeTo 0.0
        vessel moves when throttle applied:
                assembly/index.test.ts:339:2    value: -658.8227719022334       expect:  > 0.0
----------------------|---------|----------|---------|--------
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
assembly              | 95.14   | 66.23    | 100     | 95.14  
  config.ts           | 100     | 100      | 100     | 100    
  add.ts              | 100     | 100      | 100     | 100    
  index.ts            | 95.13   | 66.23    | 100     | 95.13  
assembly/util         | 100     | 100      | 100     | 100    
  test-vessel.util.ts | 100     | 100      | 100     | 100    
----------------------|---------|----------|---------|--------

Test Failed

## Previous attempts

Previous attempts at fixing this issue have added max caps and clamping to several variables such as speed, position, and course. However, these caps/clamps are not an actual solution to the problem. They only mask the underlying issue, which is that the simulation is not correctly updating the vessel's state.
To me it seems like there's a runaway calculation somewhere. For example some value is getting multiplied exponentially.

Guarded against low engine rpm and low throttle in `calculatePropellerThrust` in `assembly/index.ts`. Didn't fix it.

Flipped the sign of `propulsionForce` in `updateVesselState`. This did not seem to affect much, other than there were more test cases failing.

Set all environment values to 0 in the sim. Didn't fix it.

Asserted that totalResistance is finite and not negative.
Asserted that massSurge is finite and positive. In fact, asserted that all these are finite:

```ts
assert(isFinite(massSurge) && massSurge > 0, 'massSurge invalid');
assert(
isFinite(totalResistance) && totalResistance >= 0,
'totalResistance invalid',
);
assert(isFinite(rudderDrag) && rudderDrag >= 0, 'rudderDrag invalid');
assert(isFinite(propulsionForce), 'propulsionForce invalid');
assert(!(massSurge === 0.0), 'Mass surge should not be zero');
assert(isFinite(windSurge), 'windSurge invalid');
assert(isFinite(currentSurge), 'currentSurge invalid');
assert(isFinite(waveSurge), 'waveSurge invalid');
assert(isFinite(netForceSurge), 'netForceSurge invalid');
assert(isFinite(surgeDot), 'surgeDot invalid');
assert(isFinite(vessel.u), 'Vessel u velocity invalid');
```
These didn't seem to fix it.

This assertion however crashed the test cases:
```ts
assert(vessel.throttle <= 0.01 && vessel.u > 0 && surgeDot <= 0);
```

Tried to start the sim with a surge velocity of 5.0 m/s, to see if the vessel would slow down. It did not, and kept increasing speed.
Tried a fresh sim state by removing the localStorage object. This didn't fix it.

Tried adding a new test case in `assembly/physics.test.ts`

```ts
test('vessel slows to stop with zero throttle and no external forces', () => {
  resetGlobalVessel();
  const ptr = createTestVessel();
  setThrottle(ptr, 0);
  // Set initial forward velocity
  setVesselVelocity(ptr, 5, 0, 0);
  for (let i = 0; i < 1000; i++) {
    updateVesselState(ptr, 0.1, 0, 0, 0, 0);
  }
  expect<f64>(getVesselSurgeVelocity(ptr)).closeTo(0, 0.01);
});
```
This test case passed.

AI suggested to ensure the vessel is created at rest unless restoring a running state. Changes were made in `src/simulation/simulationLoop.ts`.

```ts
// Ensure vessel is created at rest unless restoring a running state
const initialSurge = velocity?.surge ?? 0;
const initialSway = velocity?.sway ?? 0;
const initialHeave = velocity?.heave ?? 0;
const initialThrottle = controls?.throttle ?? 0;
// If not restoring from a running state, force all to zero
const isRestoring = !!(position?.x || position?.y || position?.z || initialSurge || initialSway || initialHeave || initialThrottle);
const surge = isRestoring ? initialSurge : 0;
const sway = isRestoring ? initialSway : 0;
const heave = isRestoring ? initialHeave : 0;
const throttle = isRestoring ? initialThrottle : 0;
```

This does not seem to have fixed the issue. The vessel is still moving uncontrollably.

Sanitizing state before passing it to the WASM module. This is done in `src/simulation/simulationLoop.ts`.
  - If a value is null, undefined, or NaN, set it to a safe default (e.g., 0 for numbers, 1 for fuel level).
Should be done during vessel recreation, after tab focus loss for example.
  - Added new arrow function `safe` in `src/lib/safe.ts`
  ```ts
  export const safe (v: number, fallback: number) => isFinite(v) ? v : fallback;
  ```

Add a test case to simulate focus loss and ensure vessel is recreated with valid state. -> Focus loss is probably not the issue. Errors happen even with the sim in focus.

Adding defensive checks in `updateVesselState` in `assembly/index.ts` to ensure that the values being passed to the WASM module are valid and within expected ranges. This includes checking for NaN, null, and negative values. -> Isn't that what `isInvalidInputValues` is doing? -> Added to setter functions.

Hard reset button in the UI. Should clear vessel state and localStorage. Creates a new vessel with safe defaults. This should be done in the simulationLoop. -> Did not do much.

Suspecting double application of forces. This could be due to the way the simulation loop is structured. The `updateVesselState` function should only be called once per frame, and it should not be called multiple times in quick succession. -> AI suggests to add a counter or log to track how many times `updateVesselState` is called per frame. This could help identify if the function is being called more than once in a single frame.
-> Added a counter. I'm seeing in logs that sometimes updateVesselState is called, at worst 15397 times in a single frame. It seemed to me like this happens when not observing the sim. When observing, it seems to update, 2,4,11, maybe 61 times within a frame. From observing, found out there might be 7-55 "regular" frames between "bad" frames with multiple calls to updateVesselState. -> Implemented a limit to the number of times `updateVesselState` can be called in a single frame:

```ts
// ...existing code...
const maxPhysicsStepsPerFrame = 10;
let steps = 0;
while (this.accumulatedTime >= this.fixedTimeStep && steps < maxPhysicsStepsPerFrame) {
  this.updatePhysics(this.fixedTimeStep);
  this.accumulatedTime -= this.fixedTimeStep;
  steps++;
}
if (steps === maxPhysicsStepsPerFrame) {
  // Prevent spiral of death: drop any excess accumulated time
  this.accumulatedTime = 0;
  console.warn('Physics steps capped per frame. Dropping excess accumulated time.');
}
// ...existing code...
```

This did not really fix the issue. The vessel is still moving uncontrollably. It also added some jarring stuttering to the simulation. I removed the while-loop and the steps counter + called `updatePhysics` once per loop. I'm no longer getting the "updateVesselState called too many times" error, but the physics error persists. Tried with a fresh localStorage + state as well.

Should check that only the WASM module updates the vessel's position and velocity.
Frontend shouldn't call `setPosition` or `setVelocity` or `setSurgeVelocity` or anything like that.

> Your test for “vessel slows to stop with zero throttle and no external forces” passes, but in the sim, the vessel does not slow down.
> This suggests that in the sim, either:
> 
> The resistance/drag is not being applied correctly (e.g., sign error, or not subtracted from net force), or
> The vessel’s velocity is being updated incorrectly (e.g., wrong sign in position/velocity update), or
> The vessel is being re-initialized with a nonzero velocity, or
> The physics update is not using the same code path as the test.

Suggested action is to add a test that exactly mimics the sim's vessel creation, and update path, using the same initial state as the sim (for example from localStorage). Compare values of all forces and velocities at each step. This should help identify where the discrepancy is. -> Created a test cases in `assembly/diagnostic-sim-path.test.ts`. It failed in several expects.
```
        diagnostic: vessel state matches sim path:      
                assembly/diagnostic-sim-path.test.ts:102:2      value: -11858.530935259352      expect:  closeTo 0.0
                assembly/diagnostic-sim-path.test.ts:103:2      value: -7265.50008113779        expect:  closeTo 0.0
                assembly/diagnostic-sim-path.test.ts:104:2      value: 13907.27318245803        expect:  closeTo 0.0
```

Apparently this means the bug is in the physics code and not in FE.

Side note, trace, console.info etc still don't work in test files or in AS source code. If they're output somewhere, I cannot find them.

Check Zustand store after every call to `updateVesselState`. Should already be happening in `updateUIFromPhysics` in `src/simulation/simulationLoop.ts`. This function is called after every call to `updateVesselState`. It should be logging the state of the vessel after every update. If the state is not being updated correctly, it should be logged out.

Check that `accumulatedTime` in `src/simulation/simulationLoop.ts` doesn't grow unbounded. `updatePhysics` should be called with a reasonable time step `dt` such as `1/60`.

Ensure environment values passed to WASM are truly zero and not a really small value. -> Log values passed to `updateVesselState` in FE. Can't log it in WASM because it doesn't show up anywhere.

Double check formulas for updating position and velocity in AS.
Add assertions that with positive velocity, position increases as expected.
If we assume 0 degrees is north, and 90 degrees is east, then:
- 0 degrees should increase y. x should stay the same.
- 45 degrees should increase both x and y.
- 90 degrees should increase x. y should stay the same.
- 135 degrees should decrease x and increase y.
- 180 degrees should decrease y. x should stay the same.
- 225 degrees should decrease both x and y.
- 270 degrees should decrease x. y should stay the same.
- 315 degrees should increase x and decrease y.

Should test for both surge and sway velocities.

I changed netForceSurge calculation to:
```ts
  const netForceSurge =
    propulsionForce +
    windSurge +
    currentSurge +
    waveSurge -
    totalResistance * Math.sign(vessel.u) -
    rudderDrag * Math.sign(vessel.u);
```
and now the ship goes straight. It still gains speed even from the slightest force though. It also maintains that speed.

Problem was the missing sign. They were also added to other calculations such as `netForceSway`, `netForceHeave`, `netTorqueRoll`, `netTorquePitch`, and `netTorqueYaw`.

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
👆 These have been refactored into `assembly/config.ts`. Should check still if there are any left.

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

👆 null values have been fixed: Here's updated localStorage:
```jsonc
{
    "state": {
        "vessel": {
            "position": {
                "x": -9021.026534744919,
                "y": 7672.150443293982,
                "z": 0
            },
            "orientation": {
                "heading": 6.283185303751828,
                "roll": 0,
                "pitch": 0
            },
            "velocity": {
                "surge": -9070.194422099914,
                "sway": 2887.459223900695,
                "heave": 0
            },
            "angularVelocity": {
                "yaw": 0,
                "roll": 0,
                "pitch": 0
            },
            "controls": {
                "throttle": 0,
                "rudderAngle": 0,
                "ballast": 0.5,
                "bowThruster": 0
            },
            "properties": {
                "name": "SS Atlantic Conveyor",
                "type": "CONTAINER",
                "mass": 14950000,
                "length": 212,
                "beam": 28,
                "draft": 9.1,
                "blockCoefficient": 0.8,
                "maxSpeed": 23
            },
            "engineState": {
                "rpm": 0,
                "fuelLevel": 0.9845027777776763,
                "fuelConsumption": 0,
                "temperature": 25,
                "oilPressure": 5,
                "load": 0,
                "running": false,
                "hours": 0
            },
            "electricalSystem": {
                "mainBusVoltage": 440,
                "generatorOutput": 0,
                "batteryLevel": 1,
                "powerConsumption": 50,
                "generatorRunning": true
            },
            "stability": {
                "metacentricHeight": 5.163329279970623,
                "centerOfGravity": {
                    "x": 0,
                    "y": 0,
                    "z": 6
                },
                "trim": 0,
                "list": 0
            },
            "alarms": {
                "engineOverheat": false,
                "lowOilPressure": false,
                "lowFuel": false,
                "fireDetected": false,
                "collisionAlert": false,
                "stabilityWarning": false,
                "generatorFault": false,
                "blackout": false,
                "otherAlarms": {}
            }
        },
        "eventLog": [],
        "machinerySystems": {
            "engineHealth": 1,
            "propulsionEfficiency": 1,
            "electricalSystemHealth": 1,
            "steeringSystemHealth": 1,
            "failures": {
                "engineFailure": false,
                "propellerDamage": false,
                "rudderFailure": false,
                "electricalFailure": false,
                "pumpFailure": false
            }
        },
        "wasmVesselPtr": 7872,
        "wasmExports": {},
        "navigation": {
            "route": {
                "waypoints": [],
                "currentWaypoint": -1
            },
            "charts": {
                "visible": true,
                "scale": 1
            },
            "navigationMode": "manual",
            "autopilotHeading": null
        },
        "environment": {
            "wind": {
                "speed": 0.04866867854132749,
                "direction": 0.06893819163226925,
                "gusting": false,
                "gustFactor": 1.5
            },
            "current": {
                "speed": 0,
                "direction": 0.7853981633974483,
                "variability": 0
            },
            "seaState": 0,
            "waterDepth": 100,
            "waveHeight": 0,
            "waveDirection": 0.06929116714208491,
            "waveLength": 50,
            "visibility": 10,
            "timeOfDay": 12,
            "precipitation": "none",
            "precipitationIntensity": 0
        }
    },
    "version": 0
}
```

## Unreachable executed error (fixed...?)

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

👆 haven't received this error for a long time.

## Error: WebAssembly module aborted execution

Happens in src\lib\customWasmLoader.ts (79:17) @ abort

What I did: Started the sim, let it run for a while, alt-tabbed out and then back in (focus loss). The sim was still running but the runtime error came up.

There's also a browser console error:
```
AssemblyScript abort: at line 998:3
```

Another browser console error:
```
AssemblyScript abort: at line 7728:6784
```
Weirdly enough, the index.ts file doesn't have that many lines.

Error seems to happen also when simply observing the sim.

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

## Missing values (fixed)

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

👆 There should now be no missing values. Physics are calculated and all values are finite.

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

👆 This was fixed by updating the path the script looks into for the debug build of wasm. It was updated at some point to point into the public folder instead of build folder. Here's the latest export:
```
Checking WebAssembly exports...

Analyzing debug build: E:\IDrive-Backup\code\github\web\ship-sim\public\wasm\debug.wasm


======== DEBUG WASM ANALYSIS ========
Total exports: 30
User-defined exports: 30

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
  - getVesselSurgeVelocity
  - getVesselSwayVelocity
  - getVesselHeaveVelocity
  - getVesselRudderAngle
  - getVesselBallastLevel
  - setVesselVelocity
  - resetGlobalVessel

✅ All expected functions are exported.

Analyzing release build: E:\IDrive-Backup\code\github\web\ship-sim\public\wasm\ship_sim.wasm


======== RELEASE WASM ANALYSIS ========
Total exports: 30
User-defined exports: 30

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
  - getVesselSurgeVelocity
  - getVesselSwayVelocity
  - getVesselHeaveVelocity
  - getVesselRudderAngle
  - getVesselBallastLevel
  - setVesselVelocity
  - resetGlobalVessel

✅ All expected functions are exported.

✅ All WebAssembly exports validated successfully!  
```

## Missing counteracting forces?

If there should be counteracting forces on the vessel, make sure these are applied correctly.

## Custom fallback code (fixed)

There's some custom code in `src/lib/wasmBridge.ts`. The frontend should rely as much on the wasm module as possible. From what I recall, the custom code was added as a fallback for when some wasm functions were not exported correctly.

👆 Removed these, issue prevails but less code to maintain.

## accumulatedTime in simulationLoop

In the simulationLoop there's a private method called `loop`. It calls methods such as `updateUIFromPhysics`, `updatePhysics` and `updateWaveProperties`. These should be verified, that they work as intended.
`updatePhysics` in particular seems to be called conditionally if `accumulatedTime` is greater than or equal to `fixedTimeStep` Why?

```ts
// Run fixed timestep physics updates
while (this.accumulatedTime >= this.fixedTimeStep) {
this.updatePhysics(this.fixedTimeStep);
this.accumulatedTime -= this.fixedTimeStep;
}
```

AI says this logic for incrementing accumulatedTime is correct. 

AI: The `accumulatedTime` variable is used to keep track of the time that has passed since the last physics update. The `fixedTimeStep` variable represents the amount of time that should pass between each physics update. By subtracting `fixedTimeStep` from `accumulatedTime`, the simulation can run at a consistent rate, regardless of how fast or slow the rendering loop runs.

I removed the while-loop and sim seems to be running fine.

## Vessel position not saved correctly (fixed)

Position is also not saved correctly on page refresh. Vessel always starts from 0,0,0.

👆 This was fixed by storing the full state into localStorage.

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
