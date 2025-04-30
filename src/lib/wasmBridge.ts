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
    if (
      !this.wasmModule ||
      typeof this.wasmModule.updateVesselState !== 'function'
    ) {
      console.warn('updateVesselState function not available in WASM module');
      return vesselPtr;
    }

    try {
      // Validate vessel pointer
      if (!Number.isInteger(vesselPtr) || vesselPtr <= 0) {
        console.warn(
          'Invalid vessel pointer for updateVesselState:',
          vesselPtr,
        );
        return vesselPtr;
      }

      // Validate and sanitize parameters
      const safeDt =
        typeof dt === 'number' && isFinite(dt) && dt > 0
          ? Math.min(dt, 1.0) // Cap at 1 second to prevent instability
          : 0.016; // Default to ~60fps if invalid

      const safeWindSpeed =
        typeof windSpeed === 'number' && isFinite(windSpeed)
          ? Math.max(0, Math.min(50, windSpeed)) // Cap at 50 m/s (strong hurricane)
          : 0;

      const safeWindDirection =
        typeof windDirection === 'number' && isFinite(windDirection)
          ? windDirection % (2 * Math.PI) // Normalize to [0, 2π)
          : 0;

      const safeCurrentSpeed =
        typeof currentSpeed === 'number' && isFinite(currentSpeed)
          ? Math.max(0, Math.min(10, currentSpeed)) // Cap at 10 m/s (very strong current)
          : 0;

      const safeCurrentDirection =
        typeof currentDirection === 'number' && isFinite(currentDirection)
          ? currentDirection % (2 * Math.PI) // Normalize to [0, 2π)
          : 0;

      const safeSeaState =
        typeof seaState === 'number' && isFinite(seaState)
          ? Math.max(0, Math.min(12, seaState)) // Beaufort scale 0-12
          : 0;

      return this.wasmModule.updateVesselState(
        vesselPtr,
        safeDt,
        safeWindSpeed,
        safeWindDirection,
        safeCurrentSpeed,
        safeCurrentDirection,
        safeSeaState,
      );
    } catch (error) {
      console.error('Error in updateVesselState:', error);
      return vesselPtr; // Return original pointer to prevent errors downstream
    }
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
    if (!this.wasmModule || typeof this.wasmModule.setThrottle !== 'function') {
      console.warn('setThrottle function not available in WASM module');
      return;
    }

    try {
      // Validate vessel pointer
      if (!Number.isInteger(vesselPtr) || vesselPtr <= 0) {
        console.warn('Invalid vessel pointer for setThrottle:', vesselPtr);
        return;
      }

      // Clamp throttle between 0 and 1
      const safeThrottle =
        typeof throttle === 'number' && isFinite(throttle)
          ? Math.max(0, Math.min(1, throttle))
          : 0; // Default to 0 if invalid

      this.wasmModule.setThrottle(vesselPtr, safeThrottle);
    } catch (error) {
      console.error('Error in setThrottle:', error);
    }
  }

  /**
   * Set the vessel rudder angle
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param angle - Rudder angle in radians
   */
  public setRudderAngle(vesselPtr: number, angle: number): void {
    if (
      !this.wasmModule ||
      typeof this.wasmModule.setRudderAngle !== 'function'
    ) {
      console.warn('setRudderAngle function not available in WASM module');
      return;
    }

    try {
      // Validate vessel pointer
      if (!Number.isInteger(vesselPtr) || vesselPtr <= 0) {
        console.warn('Invalid vessel pointer for setRudderAngle:', vesselPtr);
        return;
      }

      // Ensure angle is a valid number, typically should be within ±0.6 radians (±35°)
      // but we'll clamp to a slightly wider range for safety
      const safeAngle =
        typeof angle === 'number' && isFinite(angle)
          ? Math.max(-1.0, Math.min(1.0, angle)) // Clamp between -1.0 and 1.0 radians
          : 0; // Default to 0 if invalid

      this.wasmModule.setRudderAngle(vesselPtr, safeAngle);
    } catch (error) {
      console.error('Error in setRudderAngle:', error);
    }
  }

  /**
   * Set the vessel ballast level
   * @param vesselPtr - Pointer to vessel in WASM memory
   * @param level - Ballast level (0-1)
   */
  public setBallast(vesselPtr: number, level: number): void {
    if (!this.wasmModule || typeof this.wasmModule.setBallast !== 'function') {
      console.warn('setBallast function not available in WASM module');
      return;
    }

    try {
      // Ensure valid parameters
      if (typeof vesselPtr !== 'number' || vesselPtr <= 0) {
        console.warn('Invalid vessel pointer for setBallast:', vesselPtr);
        return;
      }

      // Clamp ballast level between 0 and 1
      const safeLevel =
        typeof level === 'number' && isFinite(level)
          ? Math.max(0, Math.min(1, level))
          : 0.5; // Default to 0.5 if invalid

      this.wasmModule.setBallast(vesselPtr, safeLevel);
    } catch (error) {
      console.error('Error in setBallast:', error);
      // Don't rethrow to prevent simulation crash
    }
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
    if (!this.wasmModule || typeof this.wasmModule.setWaveData !== 'function') {
      console.warn('setWaveData function not available in WASM module');
      return;
    }

    try {
      // Validate vessel pointer
      if (!Number.isInteger(vesselPtr) || vesselPtr <= 0) {
        console.warn('Invalid vessel pointer for setWaveData:', vesselPtr);
        return;
      }

      // Sanitize wave height (typically between 0 and 15m)
      const safeHeight =
        typeof height === 'number' && isFinite(height)
          ? Math.max(0, Math.min(15, height))
          : 0;

      // Normalize phase to [0, 2π)
      const safePhase =
        typeof phase === 'number' && isFinite(phase)
          ? phase % (2 * Math.PI)
          : 0;

      this.wasmModule.setWaveData(vesselPtr, safeHeight, safePhase);
    } catch (error) {
      console.error('Error in setWaveData:', error);
    }
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
   * Calculate sea state (Beaufort scale) from wind speed
   * @param windSpeed - Wind speed in m/s
   * @returns Beaufort scale value (0-12)
   */
  public calculateSeaState(windSpeed: number): number {
    // Check if the WASM function exists
    if (
      this.wasmModule &&
      typeof this.wasmModule.calculateBeaufortScale === 'function'
    ) {
      return this.wasmModule.calculateBeaufortScale(windSpeed);
    }

    // Fallback implementation if WASM function is not available
    // Convert wind speed to appropriate Beaufort scale number based on m/s
    if (windSpeed < 0.5) return 0; // Calm: < 0.5 m/s
    if (windSpeed < 1.5) return 1; // Light Air: 0.5-1.5 m/s
    if (windSpeed < 3.3) return 2; // Light Breeze: 1.6-3.3 m/s
    if (windSpeed < 5.5) return 3; // Gentle Breeze: 3.4-5.5 m/s
    if (windSpeed < 8.0) return 4; // Moderate Breeze: 5.6-8.0 m/s
    if (windSpeed < 10.8) return 5; // Fresh Breeze: 8.1-10.8 m/s
    if (windSpeed < 13.9) return 6; // Strong Breeze: 10.9-13.9 m/s
    if (windSpeed < 17.2) return 7; // Near Gale: 13.9-17.2 m/s
    if (windSpeed < 20.8) return 8; // Gale: 17.2-20.8 m/s
    if (windSpeed < 24.5) return 9; // Strong Gale: 20.8-24.5 m/s
    if (windSpeed < 28.5) return 10; // Storm: 24.5-28.5 m/s
    if (windSpeed < 32.7) return 11; // Violent Storm: 28.5-32.7 m/s
    return 12; // Hurricane: ≥ 32.7 m/s
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
   * Calculate wave properties for a given sea state and wind direction
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
   * Calculates the wave frequency for a given sea state.
   * @param seaState - The sea state (0-12, Beaufort scale)
   * @returns The wave frequency in radians per second
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
