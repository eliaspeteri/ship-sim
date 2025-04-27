/**
 * Bridge module for AssemblyScript WASM exports
 *
 * This module bridges the gap between what's expected by the TypeScript
 * definitions and what's actually exported by the WebAssembly module.
 * It implements missing functions in JavaScript when they can't be exported
 * directly from AssemblyScript due to compiler limitations.
 */

import { WasmModule } from '../types/wasm';

// Additional interface to extend WasmModule with test functions
interface ExtendedWasmModule extends WasmModule {
  add?: (a: number, b: number) => number;
  multiply?: (a: number, b: number) => number;
}

export class WasmBridge {
  private wasmModule: ExtendedWasmModule;
  private cachedSeaState: number = 0;
  private cachedWindDirection: number = 0;

  constructor(module: WasmModule) {
    this.wasmModule = module as ExtendedWasmModule;
  }

  // Directly mapped functions - these are already exported by the WASM module
  public add(a: number, b: number): number {
    return this.wasmModule.add ? this.wasmModule.add(a, b) : a + b;
  }

  public multiply(a: number, b: number): number {
    return this.wasmModule.multiply ? this.wasmModule.multiply(a, b) : a * b;
  }

  public updateVesselState(
    vesselPtr: number,
    dt: number,
    windSpeed?: number,
    windDirection?: number,
    currentSpeed?: number,
    currentDirection?: number,
    seaState?: number,
  ): number {
    if (seaState !== undefined) this.cachedSeaState = seaState;
    if (windDirection !== undefined) this.cachedWindDirection = windDirection;

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

  public createVessel(): number {
    return this.wasmModule.createVessel();
  }

  public setThrottle(vesselPtr: number, throttle: number): void {
    this.wasmModule.setThrottle(vesselPtr, throttle);
  }

  public setRudderAngle(vesselPtr: number, angle: number): void {
    this.wasmModule.setRudderAngle(vesselPtr, angle);
  }

  public setBallast(vesselPtr: number, level: number): void {
    this.wasmModule.setBallast(vesselPtr, level);
  }

  public getVesselX(vesselPtr: number): number {
    return this.wasmModule.getVesselX(vesselPtr);
  }

  public getVesselY(vesselPtr: number): number {
    return this.wasmModule.getVesselY(vesselPtr);
  }

  public getVesselHeading(vesselPtr: number): number {
    return this.wasmModule.getVesselHeading(vesselPtr);
  }

  public getVesselSpeed(vesselPtr: number): number {
    return this.wasmModule.getVesselSpeed(vesselPtr);
  }

  public getVesselEngineRPM(vesselPtr: number): number {
    return this.wasmModule.getVesselEngineRPM(vesselPtr);
  }

  public getVesselFuelLevel(vesselPtr: number): number {
    return this.wasmModule.getVesselFuelLevel(vesselPtr);
  }

  public getVesselFuelConsumption(vesselPtr: number): number {
    return this.wasmModule.getVesselFuelConsumption(vesselPtr);
  }

  public getVesselGM(vesselPtr: number): number {
    return this.wasmModule.getVesselGM(vesselPtr);
  }

  public getVesselCenterOfGravityY(vesselPtr: number): number {
    return this.wasmModule.getVesselCenterOfGravityY(vesselPtr);
  }

  // Missing functions implemented in JavaScript
  public setWaveData(vesselPtr: number, height: number, phase: number): void {
    // Store the wave data in JavaScript and use it when needed
    this.setVesselProperty(vesselPtr, 'waveHeight', height);
    this.setVesselProperty(vesselPtr, 'wavePhase', phase);
  }

  public getVesselZ(vesselPtr: number): number {
    // Approximate based on wave height if available
    const waveHeight = this.getVesselWaveHeight(vesselPtr);
    return Math.max(0, waveHeight * 0.3); // Approximate vertical position based on wave
  }

  public getVesselRollAngle(vesselPtr: number): number {
    // Approximate based on wave height and phase
    const waveHeight = this.getVesselWaveHeight(vesselPtr);
    const wavePhase = this.getVesselWavePhase(vesselPtr);
    return Math.sin(wavePhase) * waveHeight * 0.1; // Simplified roll estimation
  }

  public getVesselPitchAngle(vesselPtr: number): number {
    // Approximate based on wave height and phase
    const waveHeight = this.getVesselWaveHeight(vesselPtr);
    const wavePhase = this.getVesselWavePhase(vesselPtr);
    return Math.cos(wavePhase) * waveHeight * 0.05; // Simplified pitch estimation
  }

  public getWaveHeight(seaState: number): number {
    // Implement the BEAUFORT_WAVE_HEIGHTS lookup in JavaScript
    const BEAUFORT_WAVE_HEIGHTS = [
      0.0, 0.1, 0.2, 0.6, 1.0, 2.0, 3.0, 4.0, 5.5, 7.0, 9.0, 11.5, 14.0,
    ];

    if (seaState < 0.5) return 0.0;
    const index = Math.min(Math.max(0, Math.floor(seaState)), 12);
    return BEAUFORT_WAVE_HEIGHTS[index];
  }

  public getWaveFrequency(seaState: number): number {
    if (seaState < 0.5) return 0.0;
    const wavePeriod = 3.0 + seaState * 0.8;
    return (2.0 * Math.PI) / wavePeriod;
  }

  public getVesselWaveHeight(vesselPtr: number): number {
    // Either use the cached wave height or estimate from sea state
    const vesselProperty = this.getVesselProperty(vesselPtr, 'waveHeight');
    if (vesselProperty !== undefined) return vesselProperty;
    return this.getWaveHeight(this.cachedSeaState);
  }

  public getVesselWavePhase(vesselPtr: number): number {
    // Either use the cached wave phase or estimate
    const vesselProperty = this.getVesselProperty(vesselPtr, 'wavePhase');
    if (vesselProperty !== undefined) return vesselProperty;

    // Estimate phase based on position if we have no cached value
    const x = this.getVesselX(vesselPtr);
    const y = this.getVesselY(vesselPtr);
    const dirX = Math.cos(this.cachedWindDirection);
    const dirY = Math.sin(this.cachedWindDirection);
    return (x * dirX + y * dirY) * 0.1; // Simple approximation
  }

  public calculateWaveProperties(
    seaState: number,
    windSpeed: number,
    windDirection: number,
  ): number[] {
    const waveHeight = this.getWaveHeight(seaState);
    const wavePeriod = 3.0 + seaState * 0.8;
    const waveLength = 1.56 * wavePeriod * wavePeriod;
    const waveFrequency = (2.0 * Math.PI) / wavePeriod;
    const waveDirectionValue = windDirection - Math.PI * 0.1;

    return [waveHeight, waveLength, waveFrequency, waveDirectionValue];
  }

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
    if (seaState < 0.5) return 0.0;

    // Calculate wave number
    const k = (2.0 * Math.PI) / waveLength;

    // Direction vector
    const dirX = Math.cos(waveDirection);
    const dirY = Math.sin(waveDirection);

    // Dot product of position and direction
    const dot = x * dirX + y * dirY;

    // Primary wave
    const phase = k * dot - waveFrequency * time;
    return waveHeight * 0.5 * Math.sin(phase);
  }

  // Utility methods for internal state management
  private vesselProperties: Map<number, Map<string, number>> = new Map();

  private setVesselProperty(
    vesselPtr: number,
    property: string,
    value: number,
  ): void {
    if (!this.vesselProperties.has(vesselPtr)) {
      this.vesselProperties.set(vesselPtr, new Map<string, number>());
    }
    this.vesselProperties.get(vesselPtr)?.set(property, value);
  }

  private getVesselProperty(
    vesselPtr: number,
    property: string,
  ): number | undefined {
    return this.vesselProperties.get(vesselPtr)?.get(property);
  }
}
