import { WasmModule } from '../types/wasm';

/**
 * Thin wrapper around the WASM physics module.
 * Only exposes the functions the simulation loop uses today.
 */
export class WasmBridge {
  private wasmModule: WasmModule;

  constructor(module: WasmModule) {
    this.wasmModule = module;
  }

  updateVesselState(
    vesselPtr: number,
    dt: number,
    windSpeed: number,
    windDirection: number,
    currentSpeed: number,
    currentDirection: number,
    waveHeight: number,
    waveLength: number,
    waveDirection: number,
    waveSteepness: number,
  ): number {
    return this.wasmModule.updateVesselState(
      vesselPtr,
      dt,
      windSpeed,
      windDirection,
      currentSpeed,
      currentDirection,
      waveHeight,
      waveLength,
      waveDirection,
      waveSteepness,
    );
  }

  setVesselParams(vesselPtr: number, modelId: number, params: number[]): void {
    if (
      !this.wasmModule.setVesselParams ||
      !this.wasmModule.getVesselParamsBufferPtr ||
      !this.wasmModule.getVesselParamsBufferCapacity ||
      !this.wasmModule.memory
    ) {
      return;
    }

    const capacity = this.wasmModule.getVesselParamsBufferCapacity();
    const ptr = this.wasmModule.getVesselParamsBufferPtr();
    if (!ptr || capacity <= 0) return;

    const buffer = new Float64Array(
      this.wasmModule.memory.buffer,
      ptr,
      capacity,
    );
    const count = Math.min(params.length, capacity);
    buffer.fill(Number.NaN);
    for (let i = 0; i < count; i++) {
      buffer[i] = params[i];
    }

    this.wasmModule.setVesselParams(vesselPtr, modelId, ptr, count);
  }

  setEnvironment(params: number[]): void {
    if (
      !this.wasmModule.setEnvironment ||
      !this.wasmModule.getEnvironmentBufferPtr ||
      !this.wasmModule.getEnvironmentBufferCapacity ||
      !this.wasmModule.memory
    ) {
      return;
    }

    const capacity = this.wasmModule.getEnvironmentBufferCapacity();
    const ptr = this.wasmModule.getEnvironmentBufferPtr();
    if (!ptr || capacity <= 0) return;

    const buffer = new Float64Array(
      this.wasmModule.memory.buffer,
      ptr,
      capacity,
    );
    const count = Math.min(params.length, capacity);
    buffer.fill(Number.NaN);
    for (let i = 0; i < count; i++) {
      buffer[i] = params[i];
    }

    this.wasmModule.setEnvironment(ptr, count);
  }

  createVessel(
    x: number,
    y: number,
    z: number,
    heading: number,
    roll: number,
    pitch: number,
    surge: number,
    sway: number,
    heave: number,
    yawRate: number,
    rollRate: number,
    pitchRate: number,
    throttle: number,
    rudderAngle: number,
    mass: number,
    length: number,
    beam: number,
    draft: number,
    blockCoefficient: number,
    rudderForceCoefficient: number,
    rudderStallAngle: number,
    rudderMaxAngle: number,
    dragCoefficient: number,
    yawDamping: number,
    yawDampingQuad: number,
    swayDamping: number,
    maxThrust: number,
    maxSpeed: number,
    rollDamping: number,
    pitchDamping: number,
    heaveStiffness: number,
    heaveDamping: number,
  ): number {
    return this.wasmModule.createVessel(
      x,
      y,
      z,
      heading,
      roll,
      pitch,
      surge,
      sway,
      heave,
      yawRate,
      rollRate,
      pitchRate,
      throttle,
      rudderAngle,
      mass,
      length,
      beam,
      draft,
      blockCoefficient,
      rudderForceCoefficient,
      rudderStallAngle,
      rudderMaxAngle,
      dragCoefficient,
      yawDamping,
      yawDampingQuad,
      swayDamping,
      maxThrust,
      maxSpeed,
      rollDamping,
      pitchDamping,
      heaveStiffness,
      heaveDamping,
    );
  }

  destroyVessel(vesselPtr: number): void {
    if (this.wasmModule.destroyVessel) {
      this.wasmModule.destroyVessel(vesselPtr);
      return;
    }
    this.wasmModule.resetGlobalVessel?.();
  }

  setThrottle(vesselPtr: number, throttle: number): void {
    this.wasmModule.setThrottle(vesselPtr, throttle);
  }

  setRudderAngle(vesselPtr: number, angle: number): void {
    this.wasmModule.setRudderAngle(vesselPtr, angle);
  }

  setBallast(vesselPtr: number, level: number): void {
    this.wasmModule.setBallast(vesselPtr, level);
  }

  getVesselX(vesselPtr: number): number {
    return this.wasmModule.getVesselX(vesselPtr);
  }
  getVesselY(vesselPtr: number): number {
    return this.wasmModule.getVesselY(vesselPtr);
  }
  getVesselZ(vesselPtr: number): number {
    return this.wasmModule.getVesselZ(vesselPtr);
  }
  getVesselHeading(vesselPtr: number): number {
    return this.wasmModule.getVesselHeading(vesselPtr);
  }
  getVesselSpeed(vesselPtr: number): number {
    return this.wasmModule.getVesselSpeed(vesselPtr);
  }
  getVesselRollAngle(vesselPtr: number): number {
    return this.wasmModule.getVesselRollAngle(vesselPtr);
  }
  getVesselPitchAngle(vesselPtr: number): number {
    return this.wasmModule.getVesselPitchAngle(vesselPtr);
  }
  getVesselEngineRPM(vesselPtr: number): number {
    return this.wasmModule.getVesselEngineRPM(vesselPtr);
  }
  getVesselFuelLevel(vesselPtr: number): number {
    return this.wasmModule.getVesselFuelLevel(vesselPtr);
  }
  getVesselFuelConsumption(vesselPtr: number): number {
    return this.wasmModule.getVesselFuelConsumption(vesselPtr);
  }
  getVesselGM(vesselPtr: number): number {
    return this.wasmModule.getVesselGM(vesselPtr);
  }
  getVesselCenterOfGravityY(vesselPtr: number): number {
    return this.wasmModule.getVesselCenterOfGravityY(vesselPtr);
  }
  getVesselRudderAngle(vesselPtr: number): number {
    return this.wasmModule.getVesselRudderAngle(vesselPtr);
  }
  getVesselBallastLevel(vesselPtr: number): number {
    return this.wasmModule.getVesselBallastLevel(vesselPtr);
  }
  getVesselSurgeVelocity(vesselPtr: number): number {
    return this.wasmModule.getVesselSurgeVelocity(vesselPtr);
  }
  getVesselSwayVelocity(vesselPtr: number): number {
    return this.wasmModule.getVesselSwayVelocity(vesselPtr);
  }
  getVesselHeaveVelocity(vesselPtr: number): number {
    return this.wasmModule.getVesselHeaveVelocity(vesselPtr);
  }
  getVesselRollRate(vesselPtr: number): number {
    return this.wasmModule.getVesselRollRate(vesselPtr);
  }
  getVesselPitchRate(vesselPtr: number): number {
    return this.wasmModule.getVesselPitchRate(vesselPtr);
  }
  getVesselYawRate(vesselPtr: number): number {
    return this.wasmModule.getVesselYawRate(vesselPtr);
  }

  calculateSeaState(windSpeed: number): number {
    return this.wasmModule.calculateSeaState(windSpeed);
  }
  getWaveHeightForSeaState(seaState: number): number {
    return this.wasmModule.getWaveHeightForSeaState(seaState);
  }
}
