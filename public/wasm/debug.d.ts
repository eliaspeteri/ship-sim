/** Exported memory */
export declare const memory: WebAssembly.Memory;
/** Exported table */
export declare const table: WebAssembly.Table;
/**
 * assembly/runtimeCore/getEnvironmentBufferCapacity
 * @returns `i32`
 */
export declare function getEnvironmentBufferCapacity(): number;
/**
 * assembly/runtimeCore/getEnvironmentBufferPtr
 * @returns `usize`
 */
export declare function getEnvironmentBufferPtr(): number;
/**
 * assembly/runtimeCore/resetGlobalEnvironment
 */
export declare function resetGlobalEnvironment(): void;
/**
 * assembly/runtimeCore/resetGlobalVessel
 */
export declare function resetGlobalVessel(): void;
/**
 * assembly/runtimeCore/resetSimulationRuntime
 */
export declare function resetSimulationRuntime(): void;
/**
 * assembly/runtimeCore/getVesselParamsBufferCapacity
 * @returns `i32`
 */
export declare function getVesselParamsBufferCapacity(): number;
/**
 * assembly/runtimeCore/getVesselParamsBufferPtr
 * @returns `usize`
 */
export declare function getVesselParamsBufferPtr(): number;
/**
 * assembly/environment/calculateSeaState
 * @param windSpeed `f64`
 * @returns `f64`
 */
export declare function calculateSeaState(windSpeed: number): number;
/**
 * assembly/environment/getWaveHeightForSeaState
 * @param seaState `f64`
 * @returns `f64`
 */
export declare function getWaveHeightForSeaState(seaState: number): number;
/**
 * assembly/environment/setEnvironment
 * @param paramsPtr `usize`
 * @param paramsLen `i32`
 */
export declare function setEnvironment(paramsPtr: number, paramsLen: number): void;
/**
 * assembly/vesselParams/setVesselParams
 * @param vesselPtr `usize`
 * @param modelId `i32`
 * @param paramsPtr `usize`
 * @param paramsLen `i32`
 */
export declare function setVesselParams(vesselPtr: number, modelId: number, paramsPtr: number, paramsLen: number): void;
/**
 * assembly/simulation/createVessel
 * @param x `f64`
 * @param y `f64`
 * @param z `f64`
 * @param psi `f64`
 * @param phi `f64`
 * @param theta `f64`
 * @param u `f64`
 * @param v `f64`
 * @param w `f64`
 * @param r `f64`
 * @param p `f64`
 * @param q `f64`
 * @param throttle `f64`
 * @param rudderAngle `f64`
 * @param mass `f64`
 * @param length `f64`
 * @param beam `f64`
 * @param draft `f64`
 * @param blockCoefficient `f64`
 * @param rudderForceCoefficient `f64`
 * @param rudderStallAngle `f64`
 * @param rudderMaxAngle `f64`
 * @param dragCoefficient `f64`
 * @param yawDamping `f64`
 * @param yawDampingQuad `f64`
 * @param swayDamping `f64`
 * @param maxThrust `f64`
 * @param maxSpeed `f64`
 * @param rollDamping `f64`
 * @param pitchDamping `f64`
 * @param heaveStiffness `f64`
 * @param heaveDamping `f64`
 * @returns `usize`
 */
export declare function createVessel(x: number, y: number, z: number, psi: number, phi: number, theta: number, u: number, v: number, w: number, r: number, p: number, q: number, throttle: number, rudderAngle: number, mass: number, length: number, beam: number, draft: number, blockCoefficient?: number, rudderForceCoefficient?: number, rudderStallAngle?: number, rudderMaxAngle?: number, dragCoefficient?: number, yawDamping?: number, yawDampingQuad?: number, swayDamping?: number, maxThrust?: number, maxSpeed?: number, rollDamping?: number, pitchDamping?: number, heaveStiffness?: number, heaveDamping?: number): number;
/**
 * assembly/simulation/destroyVessel
 * @param _vesselPtr `usize`
 */
export declare function destroyVessel(_vesselPtr: number): void;
/**
 * assembly/simulation/setBallast
 * @param vesselPtr `usize`
 * @param level `f64`
 */
export declare function setBallast(vesselPtr: number, level: number): void;
/**
 * assembly/simulation/setRudderAngle
 * @param vesselPtr `usize`
 * @param angle `f64`
 */
export declare function setRudderAngle(vesselPtr: number, angle: number): void;
/**
 * assembly/simulation/setThrottle
 * @param vesselPtr `usize`
 * @param throttle `f64`
 */
export declare function setThrottle(vesselPtr: number, throttle: number): void;
/**
 * assembly/simulation/updateVesselState
 * @param vesselPtr `usize`
 * @param dt `f64`
 * @param windSpeed `f64`
 * @param windDirection `f64`
 * @param currentSpeed `f64`
 * @param currentDirection `f64`
 * @param waveHeight `f64`
 * @param waveLength `f64`
 * @param waveDirection `f64`
 * @param waveSteepness `f64`
 * @returns `usize`
 */
export declare function updateVesselState(vesselPtr: number, dt: number, windSpeed: number, windDirection: number, currentSpeed: number, currentDirection: number, waveHeight: number, waveLength: number, waveDirection: number, waveSteepness: number): number;
/**
 * assembly/getters/getVesselBallastLevel
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselBallastLevel(vesselPtr: number): number;
/**
 * assembly/getters/getVesselCenterOfGravityY
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselCenterOfGravityY(vesselPtr: number): number;
/**
 * assembly/getters/getVesselEngineRPM
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselEngineRPM(vesselPtr: number): number;
/**
 * assembly/getters/getVesselFuelConsumption
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselFuelConsumption(vesselPtr: number): number;
/**
 * assembly/getters/getVesselFuelLevel
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselFuelLevel(vesselPtr: number): number;
/**
 * assembly/getters/getVesselGM
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselGM(vesselPtr: number): number;
/**
 * assembly/getters/getVesselHeading
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselHeading(vesselPtr: number): number;
/**
 * assembly/getters/getVesselHeaveVelocity
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselHeaveVelocity(vesselPtr: number): number;
/**
 * assembly/getters/getVesselPitchAngle
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselPitchAngle(vesselPtr: number): number;
/**
 * assembly/getters/getVesselPitchRate
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselPitchRate(vesselPtr: number): number;
/**
 * assembly/getters/getVesselRollAngle
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRollAngle(vesselPtr: number): number;
/**
 * assembly/getters/getVesselRollRate
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRollRate(vesselPtr: number): number;
/**
 * assembly/getters/getVesselRudderAngle
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRudderAngle(vesselPtr: number): number;
/**
 * assembly/getters/getVesselSpeed
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselSpeed(vesselPtr: number): number;
/**
 * assembly/getters/getVesselSurgeVelocity
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselSurgeVelocity(vesselPtr: number): number;
/**
 * assembly/getters/getVesselSwayVelocity
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselSwayVelocity(vesselPtr: number): number;
/**
 * assembly/getters/getVesselX
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselX(vesselPtr: number): number;
/**
 * assembly/getters/getVesselY
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselY(vesselPtr: number): number;
/**
 * assembly/getters/getVesselYawRate
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselYawRate(vesselPtr: number): number;
/**
 * assembly/getters/getVesselZ
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselZ(vesselPtr: number): number;
