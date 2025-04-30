// Environment Model Tests for AssemblyScript WASM
// These tests verify the correctness of exported wave and environment functions.
import {
  calculateWaveLength,
  calculateWaveHeightAtPosition,
  calculateBeaufortScale,
  getWaveHeightForSeaState,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';

/**
 * Test Beaufort scale mapping from wind speed.
 */
test('calculateBeaufortScale correctly maps wind speeds', () => {
  expect<i32>(calculateBeaufortScale(0.0)).equal(0); // Calm
  expect<i32>(calculateBeaufortScale(0.5)).equal(1); // Light air
  expect<i32>(calculateBeaufortScale(3.0)).equal(2); // Light breeze
  expect<i32>(calculateBeaufortScale(5.0)).equal(3); // Gentle breeze
  expect<i32>(calculateBeaufortScale(7.0)).equal(4); // Moderate breeze
  expect<i32>(calculateBeaufortScale(9.0)).equal(5); // Fresh breeze
  expect<i32>(calculateBeaufortScale(12.0)).equal(6); // Strong breeze
  expect<i32>(calculateBeaufortScale(15.0)).equal(7); // Near gale
  expect<i32>(calculateBeaufortScale(19.0)).equal(8); // Gale
  expect<i32>(calculateBeaufortScale(23.0)).equal(9); // Strong gale
  expect<i32>(calculateBeaufortScale(26.0)).equal(10); // Storm
  expect<i32>(calculateBeaufortScale(30.0)).equal(11); // Violent storm
  expect<i32>(calculateBeaufortScale(35.0)).equal(12); // Hurricane
});

/**
 * Test getWaveHeightForSeaState returns expected values for different sea states.
 */
test('getWaveHeightForSeaState returns expected values for different sea states', () => {
  expect<f64>(getWaveHeightForSeaState(0.0)).closeTo(0.0, 0.001);
  expect<f64>(getWaveHeightForSeaState(1.0)).closeTo(0.1, 0.001);
  expect<f64>(getWaveHeightForSeaState(3.0)).closeTo(0.6, 0.001);
  expect<f64>(getWaveHeightForSeaState(5.0)).closeTo(2.0, 0.001);
  expect<f64>(getWaveHeightForSeaState(8.0)).closeTo(5.5, 0.001);
  expect<f64>(getWaveHeightForSeaState(12.0)).closeTo(14.0, 0.001);
  // Test boundary cases
  expect<f64>(getWaveHeightForSeaState(-1.0)).closeTo(0.0, 0.001); // Min clamping
  expect<f64>(getWaveHeightForSeaState(13.0)).closeTo(14.0, 0.001); // Max clamping
});

/**
 * Test calculateWaveLength is consistent with deep water wave theory.
 */
test('calculateWaveLength is consistent with deep water wave theory', () => {
  const seaState = 4.0;
  const waveLength = calculateWaveLength(seaState);
  // Deep water wave velocity: v = sqrt(g * λ / (2π))
  const expectedVelocity = Math.sqrt((9.81 * waveLength) / (2.0 * Math.PI));
  const actualVelocity = (waveLength * waveFrequency) / (2.0 * Math.PI);

  expect<f64>(actualVelocity).closeTo(expectedVelocity, 0.1);
});

/**
 * Test calculateWaveHeightAtPosition returns wave heights based on position.
 */
test('calculateWaveHeightAtPosition returns wave heights based on position', () => {
  const waveHeight = 2.0;
  const waveLength = 50.0;
  const waveFrequency = 0.5;
  const waveDirection = 0.0; // Waves traveling along positive X axis
  const seaState = 5.0;
  const time = 0.0;

  // Test points at different positions along wave direction
  const height1 = calculateWaveHeightAtPosition(
    0.0,
    0.0,
    time,
    waveHeight,
    waveLength,
    waveFrequency,
    waveDirection,
    seaState,
  );
  const height2 = calculateWaveHeightAtPosition(
    waveLength * 0.25,
    0.0,
    time,
    waveHeight,
    waveLength,
    waveFrequency,
    waveDirection,
    seaState,
  );
  const height3 = calculateWaveHeightAtPosition(
    waveLength * 0.5,
    0.0,
    time,
    waveHeight,
    waveLength,
    waveFrequency,
    waveDirection,
    seaState,
  );

  // Wave heights should follow a sinusoidal pattern
  expect<f64>(Math.abs(height1 - height3)).closeTo(0.0, 0.001); // Same phase at 0 and λ/2
  expect<f64>(Math.abs(height1 - height2)).greaterThan(0.001); // Different phase at 0 and λ/4
});

// End all tests
endTest();
