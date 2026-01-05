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
    createVessel(x, y, z, psi, _phi, _theta, u, v, w, r, _p, _q, throttle, rudderAngle, mass, length, beam, draft, blockCoefficient) {
      // assembly/index/createVessel(f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64, f64?) => usize
      exports.__setArgumentsLength(arguments.length);
      return exports.createVessel(x, y, z, psi, _phi, _theta, u, v, w, r, _p, _q, throttle, rudderAngle, mass, length, beam, draft, blockCoefficient) >>> 0;
    },
    updateVesselState(vesselPtr, dt, windSpeed, windDirection, currentSpeed, currentDirection) {
      // assembly/index/updateVesselState(usize, f64, f64, f64, f64, f64) => usize
      return exports.updateVesselState(vesselPtr, dt, windSpeed, windDirection, currentSpeed, currentDirection) >>> 0;
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
  createVessel,
  updateVesselState,
  setThrottle,
  setRudderAngle,
  setBallast,
  getVesselX,
  getVesselY,
  getVesselZ,
  getVesselHeading,
  getVesselSpeed,
  getVesselSurgeVelocity,
  getVesselSwayVelocity,
  getVesselHeaveVelocity,
  getVesselRollAngle,
  getVesselPitchAngle,
  getVesselRudderAngle,
  getVesselEngineRPM,
  getVesselFuelLevel,
  getVesselFuelConsumption,
  getVesselGM,
  getVesselCenterOfGravityY,
  getVesselBallastLevel,
  getVesselRollRate,
  getVesselPitchRate,
  getVesselYawRate,
  calculateSeaState,
  getWaveHeightForSeaState,
  resetGlobalVessel,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("debug.wasm", import.meta.url));
