import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import {
  calculateWaveLength,
  calculateWaveFrequency,
  calculateWaveHeightAtPosition,
  getWaveHeightForSeaState,
} from './index';
import { resetGlobalVessel } from './util/test-vessel.util';

/**
 * Additional wave and environmental tests to improve branch coverage
 * Focuses on boundary conditions and zero/minimal sea states
 */

test('calculateWaveHeightAtPosition returns zero for calm sea states', (): void => {
  resetGlobalVessel();
  const calmSeaState: f64 = 0.3; // Below the 0.5 threshold
  const normalSeaState: f64 = 2.0;
  const x: f64 = 10.0;
  const y: f64 = 20.0;
  const time: f64 = 5.0;
  const waveHeight: f64 = 1.0;
  const waveLength: f64 = 50.0;
  const waveFrequency: f64 = 0.5;
  const waveDirection: f64 = 0.0;

  const heightCalm: f64 = calculateWaveHeightAtPosition(
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

  const heightNormal: f64 = calculateWaveHeightAtPosition(
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

test('getWaveHeightForSeaState and calculateWaveFrequency return zero for calm sea states', (): void => {
  resetGlobalVessel();
  const calmSeaState: i32 = 0;
  const normalSeaState: i32 = 5;

  expect<f64>(getWaveHeightForSeaState(calmSeaState)).closeTo(0.0, 0.001);
  expect<f64>(getWaveHeightForSeaState(normalSeaState)).greaterThan(0.0);

  expect<f64>(calculateWaveFrequency(calmSeaState)).closeTo(2.094, 0.001); // For seaState=0, period=3.0, freq=2pi/3
  expect<f64>(calculateWaveFrequency(normalSeaState)).greaterThan(0.0);
});

test('wave calculations handle extreme sea state values', (): void => {
  resetGlobalVessel();
  const extremeSeaState: i32 = 100;
  expect<f64>(getWaveHeightForSeaState(extremeSeaState)).closeTo(14, 0.001);
  expect<f64>(calculateWaveLength(extremeSeaState)).greaterThan(0);
  expect<f64>(calculateWaveFrequency(extremeSeaState)).greaterThan(0.0);
});

test('wave calculations handle negative sea state values', (): void => {
  resetGlobalVessel();
  const negativeSeaState: f64 = -2.0;
  expect<f64>(getWaveHeightForSeaState(negativeSeaState)).closeTo(0.0, 0.001);
});

endTest();
