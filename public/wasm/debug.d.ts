/** Exported memory */
export declare const memory: WebAssembly.Memory;
/** Exported table */
export declare const table: WebAssembly.Table;
/**
 * assembly/index/createVessel
 * @param x `f64`
 * @param y `f64`
 * @param z `f64`
 * @param psi `f64`
 * @param _phi `f64`
 * @param _theta `f64`
 * @param u `f64`
 * @param v `f64`
 * @param w `f64`
 * @param r `f64`
 * @param _p `f64`
 * @param _q `f64`
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
export declare function createVessel(x: number, y: number, z: number, psi: number, _phi: number, _theta: number, u: number, v: number, w: number, r: number, _p: number, _q: number, throttle: number, rudderAngle: number, mass: number, length: number, beam: number, draft: number, blockCoefficient?: number, rudderForceCoefficient?: number, rudderStallAngle?: number, rudderMaxAngle?: number, dragCoefficient?: number, yawDamping?: number, yawDampingQuad?: number, swayDamping?: number, maxThrust?: number, maxSpeed?: number, rollDamping?: number, pitchDamping?: number, heaveStiffness?: number, heaveDamping?: number): number;
/**
 * assembly/index/destroyVessel
 * @param _vesselPtr `usize`
 */
export declare function destroyVessel(_vesselPtr: number): void;
/**
 * assembly/index/updateVesselState
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
 * assembly/index/setThrottle
 * @param vesselPtr `usize`
 * @param throttle `f64`
 */
export declare function setThrottle(vesselPtr: number, throttle: number): void;
/**
 * assembly/index/setRudderAngle
 * @param vesselPtr `usize`
 * @param angle `f64`
 */
export declare function setRudderAngle(vesselPtr: number, angle: number): void;
/**
 * assembly/index/setBallast
 * @param vesselPtr `usize`
 * @param _level `f64`
 */
export declare function setBallast(vesselPtr: number, _level: number): void;
/**
 * assembly/index/getVesselX
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselX(vesselPtr: number): number;
/**
 * assembly/index/getVesselY
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselY(vesselPtr: number): number;
/**
 * assembly/index/getVesselZ
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselZ(vesselPtr: number): number;
/**
 * assembly/index/getVesselHeading
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselHeading(vesselPtr: number): number;
/**
 * assembly/index/getVesselSpeed
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselSpeed(vesselPtr: number): number;
/**
 * assembly/index/getVesselSurgeVelocity
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselSurgeVelocity(vesselPtr: number): number;
/**
 * assembly/index/getVesselSwayVelocity
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselSwayVelocity(vesselPtr: number): number;
/**
 * assembly/index/getVesselHeaveVelocity
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselHeaveVelocity(vesselPtr: number): number;
/**
 * assembly/index/getVesselRollAngle
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRollAngle(_vesselPtr: number): number;
/**
 * assembly/index/getVesselPitchAngle
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselPitchAngle(_vesselPtr: number): number;
/**
 * assembly/index/getVesselRudderAngle
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRudderAngle(vesselPtr: number): number;
/**
 * assembly/index/getVesselEngineRPM
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselEngineRPM(vesselPtr: number): number;
/**
 * assembly/index/getVesselFuelLevel
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselFuelLevel(_vesselPtr: number): number;
/**
 * assembly/index/getVesselFuelConsumption
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselFuelConsumption(_vesselPtr: number): number;
/**
 * assembly/index/getVesselGM
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselGM(_vesselPtr: number): number;
/**
 * assembly/index/getVesselCenterOfGravityY
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselCenterOfGravityY(_vesselPtr: number): number;
/**
 * assembly/index/getVesselBallastLevel
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselBallastLevel(vesselPtr: number): number;
/**
 * assembly/index/getVesselRollRate
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRollRate(_vesselPtr: number): number;
/**
 * assembly/index/getVesselPitchRate
 * @param _vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselPitchRate(_vesselPtr: number): number;
/**
 * assembly/index/getVesselYawRate
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselYawRate(vesselPtr: number): number;
/**
 * assembly/index/getVesselWaveTime
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselWaveTime(vesselPtr: number): number;
/**
 * assembly/index/calculateSeaState
 * @param windSpeed `f64`
 * @returns `f64`
 */
export declare function calculateSeaState(windSpeed: number): number;
/**
 * assembly/index/getWaveHeightForSeaState
 * @param seaState `f64`
 * @returns `f64`
 */
export declare function getWaveHeightForSeaState(seaState: number): number;
/**
 * assembly/index/resetGlobalVessel
 */
export declare function resetGlobalVessel(): void;
