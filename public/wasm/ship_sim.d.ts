/** Exported memory */
export declare const memory: WebAssembly.Memory;
// Exported runtime interface
export declare function __new(size: number, id: number): number;
export declare function __pin(ptr: number): number;
export declare function __unpin(ptr: number): void;
export declare function __collect(): void;
export declare const __rtti_base: number;
/**
 * assembly/index/add
 * @param a `f64`
 * @param b `f64`
 * @returns `f64`
 */
export declare function add(a: number, b: number): number;
/**
 * assembly/index/multiply
 * @param a `f64`
 * @param b `f64`
 * @returns `f64`
 */
export declare function multiply(a: number, b: number): number;
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
export declare function updateVesselState(
  vesselPtr: number,
  dt: number,
  windSpeed?: number,
  windDirection?: number,
  currentSpeed?: number,
  currentDirection?: number,
  seaState?: number,
): number;
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
