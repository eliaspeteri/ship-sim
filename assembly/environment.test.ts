import {
  calculateWaveHeight,
  calculateWaveLength,
  calculateWaveFrequency,
  calculateWaveHeightAtPosition,
  calculateBeaufortScale,
  getWaveHeight,
  getWaveFrequency,
} from '../assembly/index';

import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';

// --- Environment Model Tests ---

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

test('calculateWaveHeight returns expected values for different sea states', () => {
  expect<f64>(calculateWaveHeight(0.0)).closeTo(0.0, 0.001);
  expect<f64>(calculateWaveHeight(1.0)).closeTo(0.1, 0.001);
  expect<f64>(calculateWaveHeight(3.0)).closeTo(0.6, 0.001);
  expect<f64>(calculateWaveHeight(5.0)).closeTo(2.0, 0.001);
  expect<f64>(calculateWaveHeight(8.0)).closeTo(5.5, 0.001);
  expect<f64>(calculateWaveHeight(12.0)).closeTo(14.0, 0.001);
  // Test boundary cases
  expect<f64>(calculateWaveHeight(-1.0)).closeTo(0.0, 0.001); // Min clamping
  expect<f64>(calculateWaveHeight(13.0)).closeTo(14.0, 0.001); // Max clamping
});

test('calculateWaveLength and calculateWaveFrequency are related correctly', () => {
  const seaState = 4.0;
  const waveLength = calculateWaveLength(seaState);
  const waveFrequency = calculateWaveFrequency(seaState);

  // Wave velocity (deep water) = wavelength * frequency / (2*PI)
  const expectedVelocity = Math.sqrt((9.81 * waveLength) / (2.0 * Math.PI));
  const actualVelocity = (waveLength * waveFrequency) / (2.0 * Math.PI);

  expect<f64>(actualVelocity).closeTo(expectedVelocity, 0.1);
});

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

test('getWaveHeight and getWaveFrequency operate correctly on integer sea states', () => {
  const seaState = 5;
  expect<f64>(getWaveHeight(seaState)).closeTo(2.0, 0.001);

  const freq = getWaveFrequency(seaState);
  const period = (2.0 * Math.PI) / freq;
  // Period should increase with sea state (7.0 + 0.8*5.0 = 11.0 seconds)
  expect<f64>(period).closeTo(11.0, 0.1);
});

// End all tests
endTest();
