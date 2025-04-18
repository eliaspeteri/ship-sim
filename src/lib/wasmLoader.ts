import { instantiateStreaming } from '@assemblyscript/loader';

let wasmModule: any = null;

export async function loadWasm() {
  if (wasmModule) return wasmModule;

  try {
    // Use AssemblyScript loader which handles imports automatically
    const module = await instantiateStreaming(fetch('/wasm/ship_sim.wasm'));

    wasmModule = module.exports;

    return {
      // Original test functions
      add: wasmModule.add,
      multiply: wasmModule.multiply,

      // Vessel functions
      createVessel: wasmModule.createVessel,
      updateVesselState: wasmModule.updateVesselState,
      setThrottle: wasmModule.setThrottle,
      setRudderAngle: wasmModule.setRudderAngle,
      getVesselX: wasmModule.getVesselX,
      getVesselY: wasmModule.getVesselY,
      getVesselHeading: wasmModule.getVesselHeading,
      getVesselSpeed: wasmModule.getVesselSpeed,
    };
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw error;
  }
}
