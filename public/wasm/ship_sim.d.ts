/** Exported memory */
export declare const memory: WebAssembly.Memory;
/** Exported table */
export declare const table: WebAssembly.Table;
/**
 * assembly/index/calculateWaveFrequency
 * @param seaState `f64`
 * @returns `f64`
 */
export declare function calculateWaveFrequency(seaState: number): number;
/**
 * assembly/index/getWaveHeightForSeaState
 * @param seaState `f64`
 * @returns `f64`
 */
export declare function getWaveHeightForSeaState(seaState: number): number;
/**
 * assembly/index/calculateBeaufortScale
 * @param windSpeed `f64`
 * @returns `i32`
 */
export declare function calculateBeaufortScale(windSpeed: number): number;
/**
 * assembly/index/calculateWaveLength
 * @param seaState `f64`
 * @returns `f64`
 */
export declare function calculateWaveLength(seaState: number): number;
/**
 * assembly/index/calculateWaveHeightAtPosition
 * @param x `f64`
 * @param y `f64`
 * @param time `f64`
 * @param waveHeight `f64`
 * @param waveLength `f64`
 * @param waveFrequency `f64`
 * @param waveDirection `f64`
 * @param seaState `f64`
 * @returns `f64`
 */
export declare function calculateWaveHeightAtPosition(x: number, y: number, time: number, waveHeight: number, waveLength: number, waveFrequency: number, waveDirection: number, seaState: number): number;
/**
 * assembly/index/updateVesselState
 * @param vesselPtr `usize`
 * @param dt `f64`
 * @param windSpeed `f64`
 * @param windDirection `f64`
 * @param currentSpeed `f64`
 * @param currentDirection `f64`
 * @param seaState `f64`
 * @returns `usize`
 */
export declare function updateVesselState(vesselPtr: number, dt: number, windSpeed: number, windDirection: number, currentSpeed: number, currentDirection: number, seaState: number): number;
/**
 * assembly/index/createVessel
 * @returns `usize`
 */
export declare function createVessel(): number;
/**
 * assembly/index/setThrottle
 * @param vesselPtr `usize`
 * @param throttle `f64`
 */
export declare function setThrottle(vesselPtr: number, throttle: number): void;
/**
 * assembly/index/setWaveData
 * @param vesselPtr `usize`
 * @param height `f64`
 * @param phase `f64`
 */
export declare function setWaveData(vesselPtr: number, height: number, phase: number): void;
/**
 * assembly/index/setRudderAngle
 * @param vesselPtr `usize`
 * @param angle `f64`
 */
export declare function setRudderAngle(vesselPtr: number, angle: number): void;
/**
 * assembly/index/setBallast
 * @param vesselPtr `usize`
 * @param level `f64`
 */
export declare function setBallast(vesselPtr: number, level: number): void;
/**
 * assembly/index/getVesselRollAngle
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselRollAngle(vesselPtr: number): number;
/**
 * assembly/index/getVesselPitchAngle
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselPitchAngle(vesselPtr: number): number;
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
 * assembly/index/getVesselEngineRPM
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselEngineRPM(vesselPtr: number): number;
/**
 * assembly/index/getVesselFuelLevel
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselFuelLevel(vesselPtr: number): number;
/**
 * assembly/index/getVesselFuelConsumption
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselFuelConsumption(vesselPtr: number): number;
/**
 * assembly/index/getVesselGM
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselGM(vesselPtr: number): number;
/**
 * assembly/index/getVesselCenterOfGravityY
 * @param vesselPtr `usize`
 * @returns `f64`
 */
export declare function getVesselCenterOfGravityY(vesselPtr: number): number;
/**
 * assembly/index/setVesselStateForTesting
 * @param vesselPtr `usize`
 * @param u `f64`
 * @param v `f64`
 * @param psi `f64`
 */
export declare function setVesselStateForTesting(vesselPtr: number, u: number, v: number, psi: number): void;
/**
 * assembly/index/testCoordinateTransform
 * @param vesselPtr `usize`
 * @param dt `f64`
 */
export declare function testCoordinateTransform(vesselPtr: number, dt: number): void;
