/** Exported memory */
export declare const memory: WebAssembly.Memory;
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
 * @param state `assembly/index/VesselState`
 * @param dt `f64`
 * @returns `assembly/index/VesselState`
 */
export declare function updateVesselState(state: __Internref4, dt: number): __Internref4;
/** assembly/index/VesselState */
declare class __Internref4 extends Number {
  private __nominal4: symbol;
  private __nominal0: symbol;
}
