/**
 * Bridge module for AssemblyScript WASM exports
 *
 * This module provides a unified interface to the WebAssembly functions.
 * It directly maps to WASM function calls since all functions are now properly exported.
 */

import { WasmModule } from '../types/wasm';

/**
 * WasmBridge provides a clean interface to the underlying WebAssembly physics engine
 * It ensures consistent function calls to the WASM module and handles any necessary conversions
 */
export class WasmBridge {
  private wasmModule: WasmModule;

  /**
   * Create a new WasmBridge instance
   * @param module - The loaded WebAssembly module
   */
  constructor(module: WasmModule) {
    this.wasmModule = module as WasmModule;
  }

  /**
   * Update the vessel state in the physics engine
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param dt - Time step in seconds
   * @param windSpeed - Wind speed in m/s
   * @param windDirection - Wind direction in radians
   * @param currentSpeed - Current speed in m/s
   * @param currentDirection - Current direction in radians
   * @param seaState - Sea state on Beaufort scale (0-12)
   * @returns Pointer to updated vessel
   */
  public updateVesselState(
    vesselPtr: number,
    dt: number,
    windSpeed: number,
    windDirection: number,
    currentSpeed: number,
    currentDirection: number,
    seaState: number,
  ): number {
    return this.wasmModule.updateVesselState(
      vesselPtr,
      dt,
      windSpeed,
      windDirection,
      currentSpeed,
      currentDirection,
      seaState,
    );
  }

  /**
   * Create a new vessel in the physics engine
   * @returns Pointer to vessel in WASM memory
   */
  public createVessel(): number {
    return this.wasmModule.createVessel();
  }

  /**
   * Set the vessel throttle
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param throttle - Throttle value (0-1)
   */
  public setThrottle(vesselPtr: number, throttle: number): void {
    this.wasmModule.setThrottle(vesselPtr, throttle);
  }

  /**
   * Set the vessel rudder angle
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param angle - Rudder angle in radians
   */
  public setRudderAngle(vesselPtr: number, angle: number): void {
    this.wasmModule.setRudderAngle(vesselPtr, angle);
  }

  /**
   * Set the vessel ballast level
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param level - Ballast level (0-1)
   */
  public setBallast(vesselPtr: number, level: number): void {
    this.wasmModule.setBallast(vesselPtr, level);
  }

  /**
   * Get vessel X position
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns X position in meters
   */
  public getVesselX(vesselPtr: number): number {
    return this.wasmModule.getVesselX(vesselPtr);
  }

  /**
   * Get vessel Y position
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Y position in meters
   */
  public getVesselY(vesselPtr: number): number {
    return this.wasmModule.getVesselY(vesselPtr);
  }

  /**
   * Get vessel Z position (height)
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Z position in meters
   */
  public getVesselZ(vesselPtr: number): number {
    return this.wasmModule.getVesselZ(vesselPtr);
  }

  /**
   * Get vessel heading
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Heading in radians
   */
  public getVesselHeading(vesselPtr: number): number {
    return this.wasmModule.getVesselHeading(vesselPtr);
  }

  /**
   * Get vessel speed
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Speed in m/s
   */
  public getVesselSpeed(vesselPtr: number): number {
    return this.wasmModule.getVesselSpeed(vesselPtr);
  }

  /**
   * Get vessel roll angle
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Roll angle in radians
   */
  public getVesselRollAngle(vesselPtr: number): number {
    return this.wasmModule.getVesselRollAngle(vesselPtr);
  }

  /**
   * Get vessel pitch angle
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Pitch angle in radians
   */
  public getVesselPitchAngle(vesselPtr: number): number {
    return this.wasmModule.getVesselPitchAngle(vesselPtr);
  }

  /**
   * Get vessel engine RPM
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Engine RPM
   */
  public getVesselEngineRPM(vesselPtr: number): number {
    return this.wasmModule.getVesselEngineRPM(vesselPtr);
  }

  /**
   * Get vessel fuel level
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Fuel level (0-1)
   */
  public getVesselFuelLevel(vesselPtr: number): number {
    return this.wasmModule.getVesselFuelLevel(vesselPtr);
  }

  /**
   * Get vessel fuel consumption
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Fuel consumption in kg/h
   */
  public getVesselFuelConsumption(vesselPtr: number): number {
    return this.wasmModule.getVesselFuelConsumption(vesselPtr);
  }

  /**
   * Get vessel metacentric height (stability indicator)
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns GM value in meters
   */
  public getVesselGM(vesselPtr: number): number {
    return this.wasmModule.getVesselGM(vesselPtr);
  }

  /**
   * Get vessel center of gravity Y coordinate
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Center of gravity Y coordinate in meters
   */
  public getVesselCenterOfGravityY(vesselPtr: number): number {
    return this.wasmModule.getVesselCenterOfGravityY(vesselPtr);
  }

  /**
   * Set wave data for the vessel
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param height - Wave height in meters
   * @param phase - Wave phase in radians
   */
  public setWaveData(vesselPtr: number, height: number, phase: number): void {
    this.wasmModule.setWaveData(vesselPtr, height, phase);
  }

  /**
   * Get wave height at vessel position
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Wave height in meters
   */
  public getVesselWaveHeight(vesselPtr: number): number {
    return this.wasmModule.getVesselWaveHeight(vesselPtr);
  }

  /**
   * Get wave phase at vessel position
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @returns Wave phase in radians
   */
  public getVesselWavePhase(vesselPtr: number): number {
    return this.wasmModule.getVesselWavePhase(vesselPtr);
  }

  /**
   * Get wave height for a given sea state
   * @param seaState - Sea state on Beaufort scale (0-12)
   * @returns Wave height in meters
   */
  public getWaveHeight(seaState: number): number {
    return this.wasmModule.getWaveHeight(seaState);
  }

  /**
   * Get wave frequency for a given sea state
   * @param seaState - Sea state on Beaufort scale (0-12)
   * @returns Wave frequency in rad/s
   */
  public getWaveFrequency(seaState: number): number {
    return this.wasmModule.getWaveFrequency(seaState);
  }

  /**
   * Calculate wave height at a specific position
   * @param x - X position in meters
   * @param y - Y position in meters
   * @param time - Time in seconds
   * @param waveHeight - Wave height in meters
   * @param waveLength - Wave length in meters
   * @param waveFrequency - Wave frequency in rad/s
   * @param waveDirection - Wave direction in radians
   * @param seaState - Sea state on Beaufort scale (0-12)
   * @returns Wave height in meters at the specified position
   */
  public calculateWaveHeightAtPosition(
    x: number,
    y: number,
    time: number,
    waveHeight: number,
    waveLength: number,
    waveFrequency: number,
    waveDirection: number,
    seaState: number,
  ): number {
    return this.wasmModule.calculateWaveHeightAtPosition(
      x,
      y,
      time,
      waveHeight,
      waveLength,
      waveFrequency,
      waveDirection,
      seaState,
    );
  }

  /**
   * Calculate wave properties for a given sea state and wind direction
   * @param seaState - Sea state on Beaufort scale (0-12)
   * @param windDirection - Wind direction in radians
   * @returns Array with [waveHeight, waveLength, waveFrequency, waveDirection]
   */
  public calculateWaveProperties(
    seaState: number,
    windDirection: number,
  ): [number, number, number, number] {
    const waveHeight = this.getWaveHeight(seaState);
    const waveLength = 1.56 * Math.pow(3.0 + seaState * 0.8, 2); // Approximate wave length calculation
    const waveFrequency = this.getWaveFrequency(seaState);
    const waveDirectionValue = windDirection - Math.PI * 0.1;

    return [waveHeight, waveLength, waveFrequency, waveDirectionValue];
  }
}
