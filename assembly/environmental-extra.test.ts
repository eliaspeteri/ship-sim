import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import {
  calculateWaveHeight,
  calculateWaveLength,
  calculateWaveFrequency,
  calculateWaveHeightAtPosition,
  getWaveHeight,
  getWaveFrequency,
} from './index';

/**
 * Additional wave and environmental tests to improve branch coverage
 * Focuses on boundary conditions and zero/minimal sea states
 */

// Test for Line 486: In calculateWaveHeightAtPosition function
test('calculateWaveHeightAtPosition returns zero for calm sea states', () => {
  const calmSeaState = 0.3; // Below the 0.5 threshold
  const normalSeaState = 2.0;

  // Wave parameters - values don't matter for calm sea
  const x = 10.0;
  const y = 20.0;
  const time = 5.0;
  const waveHeight = 1.0;
  const waveLength = 50.0;
  const waveFrequency = 0.5;
  const waveDirection = 0.0;

  // Test the calm condition branch
  const heightCalm = calculateWaveHeightAtPosition(
    x,
    y,
    time,
    waveHeight,
    waveLength,
    waveFrequency,
    waveDirection,
    calmSeaState,
  );
  expect<f64>(heightCalm).closeTo(0.0, 0.001);

  // Compare with non-calm condition
  const heightNormal = calculateWaveHeightAtPosition(
    x,
    y,
    time,
    waveHeight,
    waveLength,
    waveFrequency,
    waveDirection,
    normalSeaState,
  );
  expect<boolean>(Math.abs(heightNormal) > 0.0).equal(true);
});

// Test for Line 865 and 882: In getWaveHeight and getWaveFrequency functions
test('getWaveHeight and getWaveFrequency return zero for calm sea states', () => {
  const calmSeaState = 0;
  const normalSeaState = 5;

  // Test the wave height function
  expect<f64>(getWaveHeight(calmSeaState)).closeTo(0.0, 0.001);
  expect<f64>(getWaveHeight(normalSeaState)).greaterThan(0.0);

  // Test the wave frequency function
  expect<f64>(getWaveFrequency(calmSeaState)).closeTo(0.0, 0.001);
  expect<f64>(getWaveFrequency(normalSeaState)).greaterThan(0.0);
});

// Test upper bounds for sea state index calculations
test('wave calculations handle extreme sea state values', () => {
  const extremeSeaState = 100.0; // Way beyond the Beaufort scale

  // Wave height should be clamped to the maximum value (index 12)
  expect<f64>(calculateWaveHeight(extremeSeaState)).closeTo(14.0, 0.001);

  // Wave length and frequency should still produce valid results
  expect<f64>(calculateWaveLength(extremeSeaState)).greaterThan(0.0);
  expect<f64>(calculateWaveFrequency(extremeSeaState)).greaterThan(0.0);
});

// Test negative sea states (should be clamped to 0)
test('wave calculations handle negative sea state values', () => {
  const negativeSeaState = -2.0;

  expect<f64>(calculateWaveHeight(negativeSeaState)).closeTo(0.0, 0.001);
  expect<f64>(getWaveHeight(-1)).closeTo(0.0, 0.001);
});

endTest(); // Don't forget it!
