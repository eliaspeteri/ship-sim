// Facade exports for the AssemblyScript physics runtime.

export {
  getEnvironmentBufferCapacity,
  getEnvironmentBufferPtr,
  resetGlobalEnvironment,
  resetGlobalVessel,
  resetSimulationRuntime,
  getVesselParamsBufferCapacity,
  getVesselParamsBufferPtr,
} from './runtimeCore';

export {
  calculateSeaState,
  getWaveHeightForSeaState,
  setEnvironment,
} from './environment';

export { setVesselParams } from './vesselParams';

export {
  createVessel,
  destroyVessel,
  setBallast,
  setRudderAngle,
  setThrottle,
  updateVesselState,
} from './simulation';

export {
  getVesselBallastLevel,
  getVesselCenterOfGravityY,
  getVesselEngineRPM,
  getVesselFuelConsumption,
  getVesselFuelLevel,
  getVesselGM,
  getVesselHeading,
  getVesselHeaveVelocity,
  getVesselPitchAngle,
  getVesselPitchRate,
  getVesselRollAngle,
  getVesselRollRate,
  getVesselRudderAngle,
  getVesselSpeed,
  getVesselSurgeVelocity,
  getVesselSwayVelocity,
  getVesselX,
  getVesselY,
  getVesselYawRate,
  getVesselZ,
} from './getters';
