declare module 'wasm/ship_sim' {
  export function add(a: number, b: number): number;
  export function multiply(a: number, b: number): number;
  export function updateVesselState(
    state: VesselState,
    dt: number,
  ): VesselState;

  export type VesselState = {
    x: number;
    y: number;
    psi: number;
    u: number;
    v: number;
    r: number;
    throttle: number;
    rudderAngle: number;
  };
}
