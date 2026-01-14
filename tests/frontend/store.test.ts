/// <reference types="@testing-library/jest-dom" />
import { renderHook, act, cleanup } from '@testing-library/react';
import useStore from '../../src/store';
import { expect } from '@jest/globals';

afterEach(cleanup);

describe('store', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useStore());

    expect(result.current.vessel).toBeDefined();
    expect(result.current.environment).toBeDefined();
    expect(result.current.sessionUserId).toBeNull();
  });

  it('has vessel with required properties', () => {
    const { result } = renderHook(() => useStore());

    const vessel = result.current.vessel;
    expect(vessel).toHaveProperty('position');
    expect(vessel).toHaveProperty('orientation');
    expect(vessel).toHaveProperty('velocity');
  });

  it('has environment with required properties', () => {
    const { result } = renderHook(() => useStore());

    const environment = result.current.environment;
    expect(environment).toHaveProperty('wind');
    expect(environment).toHaveProperty('current');
    expect(environment).toHaveProperty('waveHeight');
    expect(environment).toHaveProperty('waveDirection');
  });

  it('can update vessel position', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.updateVessel({ position: { lat: 45, lon: -122, z: 0 } });
    });

    expect(result.current.vessel.position?.lat).toBe(45);
    expect(result.current.vessel.position?.lon).toBe(-122);
  });

  it('has crew management', () => {
    const { result } = renderHook(() => useStore());

    expect(Array.isArray(result.current.crewIds)).toBe(true);
    expect(typeof result.current.crewNames).toBe('object');
  });
});
