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
  ): number {
    return this.wasmModule.updateVesselState(
      vesselPtr,
      dt,
      windSpeed,
      windDirection,
      currentSpeed,
      currentDirection,
    );
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
