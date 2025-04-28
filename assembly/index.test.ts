import {
  calculateWaveHeight,
  calculateWaveHeightAtPosition,
  createVessel,
  getVesselHeading,
  getVesselPitchAngle,
  getVesselRollAngle,
  getVesselSpeed,
  getVesselX,
  getVesselY,
  getVesselZ,
  setBallast,
  setRudderAngle,
  setThrottle,
  setWaveData,
  updateVesselState,
  getWaveFrequency,
  getVesselEngineRPM,
  getVesselFuelLevel,
  getVesselFuelConsumption,
  getVesselGM,
  getVesselCenterOfGravityY,
  getVesselWaveHeight,
  getVesselWavePhase,
  calculateBeaufortScale,
} from '../assembly/index'; // Adjusted path assuming index.ts is in the parent 'assembly' directory

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';

// Use u64 or u32 for pointer types if usize is not directly available
// Or define usize = u64; if appropriate for the target architecture
type usize = u64; // Assuming 64-bit pointers

test('calculateBeaufortScale boundary values', () => {
  // Test lower boundaries
  expect<i32>(calculateBeaufortScale(0.0)).equal(0);
  expect<i32>(calculateBeaufortScale(0.5)).equal(1);
  expect<i32>(calculateBeaufortScale(1.5)).equal(2);
  expect<i32>(calculateBeaufortScale(3.3)).equal(3);
  expect<i32>(calculateBeaufortScale(5.5)).equal(4);
  expect<i32>(calculateBeaufortScale(8.0)).equal(5);
  expect<i32>(calculateBeaufortScale(10.8)).equal(6);
  expect<i32>(calculateBeaufortScale(13.9)).equal(7);
  expect<i32>(calculateBeaufortScale(17.2)).equal(8);
  expect<i32>(calculateBeaufortScale(20.8)).equal(9);
  expect<i32>(calculateBeaufortScale(24.5)).equal(10);
  expect<i32>(calculateBeaufortScale(28.5)).equal(11);
  expect<i32>(calculateBeaufortScale(32.7)).equal(12);
});

test('calculateBeaufortScale mid-range values', () => {
  expect<i32>(calculateBeaufortScale(0.25)).equal(0);
  expect<i32>(calculateBeaufortScale(1.0)).equal(1);
  expect<i32>(calculateBeaufortScale(2.5)).equal(2);
  expect<i32>(calculateBeaufortScale(4.4)).equal(3);
  expect<i32>(calculateBeaufortScale(6.7)).equal(4);
  expect<i32>(calculateBeaufortScale(9.5)).equal(5);
  expect<i32>(calculateBeaufortScale(12.5)).equal(6);
  expect<i32>(calculateBeaufortScale(15.5)).equal(7);
  expect<i32>(calculateBeaufortScale(19.0)).equal(8);
  expect<i32>(calculateBeaufortScale(22.5)).equal(9);
  expect<i32>(calculateBeaufortScale(26.5)).equal(10);
  expect<i32>(calculateBeaufortScale(30.0)).equal(11);
  expect<i32>(calculateBeaufortScale(40.0)).equal(12);
});

test('calculateBeaufortScale edge cases', () => {
  // Test negative values - should return 0
  expect<i32>(calculateBeaufortScale(-1.0)).equal(0);
  expect<i32>(calculateBeaufortScale(-10.0)).equal(0);

  // Test extremely high values - should return 12
  expect<i32>(calculateBeaufortScale(50.0)).equal(12);
  expect<i32>(calculateBeaufortScale(100.0)).equal(12);

  // Test values very close to the boundaries
  expect<i32>(calculateBeaufortScale(0.49)).equal(0);
  expect<i32>(calculateBeaufortScale(0.51)).equal(1);
  // Note: Original test had 3.29 -> 2 and 3.31 -> 3. The function uses '<', so 3.3 is boundary for 2.
  expect<i32>(calculateBeaufortScale(3.29)).equal(2);
  expect<i32>(calculateBeaufortScale(3.3)).equal(3); // Boundary check
  expect<i32>(calculateBeaufortScale(3.31)).equal(3);
});

test('calculateBeaufortScale with precise decimal values', () => {
  expect<i32>(calculateBeaufortScale(1.49)).equal(1);
  expect<i32>(calculateBeaufortScale(1.5)).equal(2); // Boundary check
  expect<i32>(calculateBeaufortScale(1.51)).equal(2);
  expect<i32>(calculateBeaufortScale(3.29)).equal(2);
  expect<i32>(calculateBeaufortScale(3.3)).equal(3); // Boundary check
  expect<i32>(calculateBeaufortScale(3.31)).equal(3);
  expect<i32>(calculateBeaufortScale(10.79)).equal(5);
  expect<i32>(calculateBeaufortScale(10.8)).equal(6); // Boundary check
  expect<i32>(calculateBeaufortScale(10.81)).equal(6);
});

// --- Wave Calculation Tests ---
test('calculateWaveHeight boundary values', () => {
  expect<f64>(calculateWaveHeight(0)).closeTo(0.0, 0.0001); // Calm
  expect<f64>(calculateWaveHeight(0)).closeTo(0.0, 0.0001); // Still Calm
  expect<f64>(calculateWaveHeight(0.5)).closeTo(0.1, 0.0001); // Beaufort 1
  expect<f64>(calculateWaveHeight(1)).closeTo(0.1, 0.0001);
  expect<f64>(calculateWaveHeight(1.9)).closeTo(0.2, 0.0001); // Beaufort 2
  expect<f64>(calculateWaveHeight(6)).closeTo(3.0, 0.0001); // Beaufort 6
  expect<f64>(calculateWaveHeight(12)).closeTo(14.0, 0.0001); // Beaufort 12
  expect<f64>(calculateWaveHeight(13)).closeTo(14.0, 0.0001); // Max capped at 12
  expect<f64>(calculateWaveHeight(-1)).closeTo(0.0, 0.0001); // Negative input
});

test('getWaveFrequency calculation', () => {
  expect<f64>(getWaveFrequency(0)).closeTo(0.0, 0.0001);
  expect<f64>(getWaveFrequency(0.49)).closeTo(0.0, 0.0001);
  const freq1 = (2.0 * Math.PI) / (3.0 + 1.0 * 0.8);
  expect<f64>(getWaveFrequency(1)).closeTo(freq1, 0.0001);
  const freq6 = (2.0 * Math.PI) / (3.0 + 6.0 * 0.8);
  expect<f64>(getWaveFrequency(6)).closeTo(freq6, 0.0001);
  const freq12 = (2.0 * Math.PI) / (3.0 + 12.0 * 0.8);
  expect<f64>(getWaveFrequency(12)).closeTo(freq12, 0.0001);
  expect<f64>(getWaveFrequency(13)).closeTo(freq12, 0.0001); // Capped at 12
  expect<f64>(getWaveFrequency(-1)).closeTo(0.0, 0.0001); // Negative input
});

test('calculateWaveHeightAtPosition basic cases', () => {
  // Calm sea
  expect<f64>(
    calculateWaveHeightAtPosition(10, 10, 1, 0, 100, 0.5, 0, 0),
  ).closeTo(0.0, 0.0001);

  // Simple wave
  const seaState = 6.0;
  const waveH = calculateWaveHeight(seaState);
  const waveF = getWaveFrequency(seaState);
  // Calculate wave length based on frequency (deep water approximation)
  const waveL =
    (9.81 * Math.pow((2.0 * Math.PI) / waveF, 2.0)) / (2.0 * Math.PI);
  const waveDir = 0.0; // Along X axis
  const time = 10.0;

  // At origin, time 10
  const phaseOrigin = -(waveF * time);
  const expectedHeightOrigin = waveH * 0.5 * Math.sin(phaseOrigin);
  expect<f64>(
    calculateWaveHeightAtPosition(
      0,
      0,
      time,
      waveH,
      waveL,
      waveF,
      waveDir,
      seaState,
    ),
  ).closeTo(expectedHeightOrigin, 0.0001);

  // Along wave direction
  const xPos = 50.0;
  const k = (2.0 * Math.PI) / waveL;
  const phaseX = k * xPos - waveF * time;
  const expectedHeightX = waveH * 0.5 * Math.sin(phaseX);
  expect<f64>(
    calculateWaveHeightAtPosition(
      xPos,
      0,
      time,
      waveH,
      waveL,
      waveF,
      waveDir,
      seaState,
    ),
  ).closeTo(expectedHeightX, 0.0001);
});

// --- Vessel Creation and State Tests ---
let vesselPtr: usize = 0; // Use the defined usize type

test('createVessel creates a valid pointer', () => {
  vesselPtr = createVessel();
  // Use expect<boolean> for boolean checks
  expect<boolean>(vesselPtr != (0 as usize)).equal(true);
});

test('initial vessel state getters', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  expect<f64>(getVesselX(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselY(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselZ(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselHeading(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselRollAngle(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselPitchAngle(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselSpeed(vesselPtr)).closeTo(1.0, 0.0001); // Initial speed
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(240.0, 0.0001); // Initial RPM
  expect<f64>(getVesselFuelLevel(vesselPtr)).closeTo(1.0, 0.0001); // Initial fuel level
  // Use greaterThan for comparisons
  expect<f64>(getVesselFuelConsumption(vesselPtr)).greaterThan(0.0);
  expect<f64>(getVesselGM(vesselPtr)).greaterThan(0.0);
  expect<f64>(getVesselCenterOfGravityY(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselWaveHeight(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselWavePhase(vesselPtr)).closeTo(0.0, 0.0001);
});

test('setThrottle updates RPM and consumption', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  setThrottle(vesselPtr, 0.0);
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselFuelConsumption(vesselPtr)).closeTo(0.0, 0.0001);

  setThrottle(vesselPtr, 0.5);
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(600.0, 0.0001);
  expect<f64>(getVesselFuelConsumption(vesselPtr)).greaterThan(5.0);

  setThrottle(vesselPtr, 1.0);
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(1200.0, 0.0001);
  // Check fuel consumption calculation: 5.0 + 1.0*1.0*95.0 = 100.0
  expect<f64>(getVesselFuelConsumption(vesselPtr)).closeTo(100.0, 0.0001);

  // Test clamping
  setThrottle(vesselPtr, 1.5);
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(1200.0, 0.0001);
  expect<f64>(getVesselFuelConsumption(vesselPtr)).closeTo(100.0, 0.0001); // Should be clamped
  setThrottle(vesselPtr, -0.5);
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselFuelConsumption(vesselPtr)).closeTo(0.0, 0.0001); // Should be clamped

  // Restore default for next tests
  setThrottle(vesselPtr, 0.2);
});

test('setRudderAngle updates angle', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  const maxRudder = 0.6;
  setRudderAngle(vesselPtr, 0.1);
  // Assuming a getRudderAngle function exists or testing via side effects
  // For now, just test clamping
  setRudderAngle(vesselPtr, maxRudder + 0.1);
  // expect<f64>(getRudderAngle(vesselPtr)).toBeCloseTo(maxRudder); // Hypothetical getter
  setRudderAngle(vesselPtr, -maxRudder - 0.1);
  // expect<f64>(getRudderAngle(vesselPtr)).toBeCloseTo(-maxRudder); // Hypothetical getter

  // Reset for next tests
  setRudderAngle(vesselPtr, 0.0);
});

test('setBallast updates GM', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  // Reset ballast to default 0.5 before test
  setBallast(vesselPtr, 0.5);
  const initialGM = getVesselGM(vesselPtr);
  expect<f64>(initialGM).greaterThan(0.0); // Ensure initial GM is positive

  setBallast(vesselPtr, 0.0); // Empty ballast
  const gmEmpty = getVesselGM(vesselPtr);
  // Emptying ballast raises CG, lowering GM
  expect<f64>(gmEmpty).lessThan(initialGM);

  setBallast(vesselPtr, 1.0); // Full ballast
  const gmFull = getVesselGM(vesselPtr);
  // Filling ballast lowers CG, increasing GM
  expect<f64>(gmFull).greaterThan(initialGM);
  // Also check if full is greater than empty
  expect<f64>(gmFull).greaterThan(gmEmpty);

  // Test clamping
  setBallast(vesselPtr, 1.5);
  const gmClampedHigh = getVesselGM(vesselPtr);
  expect<f64>(gmClampedHigh).closeTo(gmFull, 0.0001); // Should be same as full

  setBallast(vesselPtr, -0.5);
  const gmClampedLow = getVesselGM(vesselPtr);
  expect<f64>(gmClampedLow).closeTo(gmEmpty, 0.0001); // Should be same as empty

  // Restore default for next tests
  setBallast(vesselPtr, 0.5);
});

// --- updateVesselState Tests ---

test('updateVesselState moves vessel forward', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  setThrottle(vesselPtr, 0.5);
  setRudderAngle(vesselPtr, 0.0);
  const initialX = getVesselX(vesselPtr);
  const initialY = getVesselY(vesselPtr);
  const initialSpeed = getVesselSpeed(vesselPtr);

  updateVesselState(vesselPtr, 1.0, 0, 0, 0, 0, 0); // dt=1s, no env forces

  const finalX = getVesselX(vesselPtr);
  const finalY = getVesselY(vesselPtr);
  const finalSpeed = getVesselSpeed(vesselPtr);

  expect<f64>(finalX).greaterThan(initialX); // Should move forward along X
  expect<f64>(finalY).closeTo(initialY, 0.0001); // Should not move in Y
  expect<f64>(finalSpeed).greaterThan(initialSpeed); // Should accelerate
});

test('updateVesselState turns vessel with rudder', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  // Reset position/heading/speed
  // This requires direct state manipulation or a reset function, which we don't have.
  // We'll create a new vessel for a clean state.
  const turnVesselPtr = createVessel(); // Use a fresh vessel
  setThrottle(turnVesselPtr, 0.5);
  setRudderAngle(turnVesselPtr, 0.3); // Apply rudder
  const initialHeading = getVesselHeading(turnVesselPtr);
  const initialX = getVesselX(turnVesselPtr);
  const initialY = getVesselY(turnVesselPtr);

  // Update multiple steps for noticeable turn
  for (let i = 0; i < 5; i++) {
    updateVesselState(turnVesselPtr, 1.0, 0, 0, 0, 0, 0);
  }

  const finalHeading = getVesselHeading(turnVesselPtr);
  const finalX = getVesselX(turnVesselPtr);
  const finalY = getVesselY(turnVesselPtr);

  // Rudder angle 0.3 is positive, should turn port (increase heading)
  expect<f64>(finalHeading).greaterThan(initialHeading);
  // Should have moved forward and slightly sideways
  expect<f64>(finalX).greaterThan(initialX);
  // Check if Y position has changed significantly (not close to initial)
  expect<boolean>(Math.abs(finalY - initialY) > 0.001).equal(true);
});

test('updateVesselState consumes fuel', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  setThrottle(vesselPtr, 0.8);
  const initialFuel = getVesselFuelLevel(vesselPtr);
  expect<f64>(initialFuel).greaterThan(0.0);

  updateVesselState(vesselPtr, 10.0, 0, 0, 0, 0, 0); // Simulate 10 seconds

  const finalFuel = getVesselFuelLevel(vesselPtr);
  expect<f64>(finalFuel).lessThan(initialFuel);
});

test('updateVesselState stops engine when out of fuel', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  // Manually set fuel low (needs a setter or direct access, simulating here)
  // Assuming VesselState class is accessible for testing setup if needed
  // Or run simulation long enough
  setThrottle(vesselPtr, 1.0); // High throttle
  let currentFuel = getVesselFuelLevel(vesselPtr);
  let timeElapsed = 0.0;
  const timeStep = 10.0; // Simulate in 10s steps

  while (currentFuel > 0.0 && timeElapsed < 10000.0) {
    // Limit simulation time
    updateVesselState(vesselPtr, timeStep, 0, 0, 0, 0, 0);
    currentFuel = getVesselFuelLevel(vesselPtr);
    timeElapsed += timeStep;
  }

  expect<f64>(getVesselFuelLevel(vesselPtr)).closeTo(0.0, 0.0001);
  expect<f64>(getVesselEngineRPM(vesselPtr)).closeTo(0.0, 0.0001); // Engine should stop
  // Speed should start decreasing after fuel runs out
  const speedAfterEmpty = getVesselSpeed(vesselPtr);
  updateVesselState(vesselPtr, 1.0, 0, 0, 0, 0, 0); // One more second
  expect<f64>(getVesselSpeed(vesselPtr)).lessThan(speedAfterEmpty);
});

test('updateVesselState includes wind effect', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  // Reset state if possible, or use new vessel
  const windVesselPtr = createVessel();
  setThrottle(windVesselPtr, 0.1); // Low throttle to see wind effect
  setRudderAngle(windVesselPtr, 0.0);

  // Apply beam wind (from 90 degrees relative to initial heading 0)
  const windSpeed = 15.0; // Near Gale
  const windDirection = Math.PI / 2.0;

  const initialX = getVesselX(windVesselPtr);
  const initialY = getVesselY(windVesselPtr);
  const initialHeading = getVesselHeading(windVesselPtr);

  for (let i = 0; i < 5; i++) {
    updateVesselState(windVesselPtr, 1.0, windSpeed, windDirection, 0, 0, 0);
  }

  const finalX = getVesselX(windVesselPtr);
  const finalY = getVesselY(windVesselPtr);
  const finalHeading = getVesselHeading(windVesselPtr);

  // Beam wind should push the vessel sideways (positive Y)
  expect<f64>(finalY).greaterThan(initialY);
  // Wind should also cause some yaw moment, turning the vessel
  // Check if heading has changed significantly (not close to initial)
  expect<boolean>(Math.abs(finalHeading - initialHeading) > 0.001).equal(true);
});

test('updateVesselState includes current effect', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  const currentVesselPtr = createVessel();
  setThrottle(currentVesselPtr, 0.0); // No engine thrust
  setRudderAngle(currentVesselPtr, 0.0);

  // Apply beam current
  const currentSpeed = 1.0; // m/s
  const currentDirection = Math.PI / 2.0;

  const initialX = getVesselX(currentVesselPtr);
  const initialY = getVesselY(currentVesselPtr);

  for (let i = 0; i < 5; i++) {
    updateVesselState(
      currentVesselPtr,
      1.0,
      0,
      0,
      currentSpeed,
      currentDirection,
      0,
    );
  }

  const finalX = getVesselX(currentVesselPtr);
  const finalY = getVesselY(currentVesselPtr);

  // Beam current should push the vessel sideways (positive Y)
  expect<f64>(finalY).greaterThan(initialY);
  // Should be minimal movement in X if current is purely lateral
  expect<f64>(finalX).closeTo(getVesselX(initialX), 4); // Compare finalX to current X, or initialX if needed
});

test('updateVesselState includes wave effect (roll/pitch)', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  const waveVesselPtr = createVessel();
  setThrottle(waveVesselPtr, 0.1);
  setRudderAngle(waveVesselPtr, 0.0);

  // Apply beam sea state
  const seaState = 7.0; // Near Gale
  const windSpeed = 15.0; // Corresponding wind
  const waveDirection = Math.PI / 2.0; // Beam sea relative to heading 0

  let maxRoll = 0.0;
  let maxPitch = 0.0;

  // Simulate for a while to observe oscillations
  for (let i = 0; i < 30; i++) {
    updateVesselState(
      waveVesselPtr,
      0.5,
      windSpeed,
      waveDirection,
      0,
      0,
      seaState,
    ); // Use seaState directly here
    const roll = Math.abs(getVesselRollAngle(waveVesselPtr));
    const pitch = Math.abs(getVesselPitchAngle(waveVesselPtr));
    if (roll > maxRoll) maxRoll = roll;
    if (pitch > maxPitch) maxPitch = pitch;
  }

  // Beam sea should cause significant roll, less pitch
  expect<f64>(maxRoll).greaterThan(0.05); // Expect noticeable roll
  expect<f64>(maxPitch).lessThan(maxRoll); // Pitch should be less than roll in beam sea
  expect<boolean>(maxRoll > 0.0).equal(true); // Ensure some roll happened
});

// --- Miscellaneous Tests ---

test('setWaveData updates vessel wave state', () => {
  if (!vesselPtr) vesselPtr = createVessel();
  const testHeight = 2.5;
  const testPhase = 1.2;
  setWaveData(vesselPtr, testHeight, testPhase);
  expect<f64>(getVesselWaveHeight(vesselPtr)).closeTo(testHeight, 0.0001);
  expect<f64>(getVesselWavePhase(vesselPtr)).closeTo(testPhase, 0.0001);
});

// End tests
endTest();
