async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    getEnvironmentBufferPtr() {
      // assembly/runtimeCore/getEnvironmentBufferPtr() => usize
      return exports.getEnvironmentBufferPtr() >>> 0;
    },
    getVesselParamsBufferPtr() {
      // assembly/runtimeCore/getVesselParamsBufferPtr() => usize
      return exports.getVesselParamsBufferPtr() >>> 0;
    },
    createVessel(x, y, z, psi, phi, theta, u, v, w, r, p, q, throttle, rudderAngle, mass, length, beam, draft, blockCoefficient, rudderForceCoefficient, rudderStallAngle, rudderMaxAngle, dragCoefficient, yawDamping, yawDampingQuad, swayDamping, maxThrust, maxSpeed, rollDamping, pitchDamping, heaveStiffness, heaveDamping) {
      // assembly/simulation/createVessel(f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?, f64?) => usize
      exports.__setArgumentsLength(arguments.length);
      return exports.createVessel(x, y, z, psi, phi, theta, u, v, w, r, p, q, throttle, rudderAngle, mass, length, beam, draft, blockCoefficient, rudderForceCoefficient, rudderStallAngle, rudderMaxAngle, dragCoefficient, yawDamping, yawDampingQuad, swayDamping, maxThrust, maxSpeed, rollDamping, pitchDamping, heaveStiffness, heaveDamping) >>> 0;
    },
    updateVesselState(vesselPtr, dt, windSpeed, windDirection, currentSpeed, currentDirection, waveHeight, waveLength, waveDirection, waveSteepness) {
      // assembly/simulation/updateVesselState(usize, f64, f64, f64, f64, f64, f64, f64, f64, f64) => usize
      return exports.updateVesselState(vesselPtr, dt, windSpeed, windDirection, currentSpeed, currentDirection, waveHeight, waveLength, waveDirection, waveSteepness) >>> 0;
    },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  return adaptedExports;
}
export const {
  memory,
  table,
  getEnvironmentBufferCapacity,
  getEnvironmentBufferPtr,
  resetGlobalEnvironment,
  resetGlobalVessel,
  resetSimulationRuntime,
  getVesselParamsBufferCapacity,
  getVesselParamsBufferPtr,
  calculateSeaState,
  getWaveHeightForSeaState,
  setEnvironment,
  setVesselParams,
  createVessel,
  destroyVessel,
  setBallast,
  setRudderAngle,
  setThrottle,
  updateVesselState,
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
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("ship_sim.wasm", import.meta.url));
