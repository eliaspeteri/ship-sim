#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEBUG_WASM_PATH = path.join(__dirname, '../public/wasm/debug.wasm');
const RELEASE_WASM_PATH = path.join(__dirname, '../public/wasm/ship_sim.wasm');

const EXPECTED_EXPORTS = [
  'createVessel',
  'destroyVessel',
  'getVesselBallastLevel',
  'getVesselCenterOfGravityY',
  'getVesselEngineRPM',
  'getVesselFuelConsumption',
  'getVesselFuelLevel',
  'getVesselGM',
  'getVesselHeading',
  'getVesselHeaveVelocity',
  'getVesselPitchAngle',
  'getVesselRollAngle',
  'getVesselRudderAngle',
  'getVesselSpeed',
  'getVesselSurgeVelocity',
  'getVesselSwayVelocity',
  'getVesselX',
  'getVesselY',
  'getVesselZ',
  'getVesselRollRate',
  'getVesselPitchRate',
  'getVesselYawRate',
  'calculateSeaState',
  'getWaveHeightForSeaState',
  'resetGlobalVessel',
  'getEnvironmentBufferCapacity',
  'getEnvironmentBufferPtr',
  'getVesselParamsBufferCapacity',
  'getVesselParamsBufferPtr',
  'setEnvironment',
  'setBallast',
  'setVesselParams',
  'setRudderAngle',
  'setThrottle',
  'updateVesselState',
];

async function analyzeWasmExports(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`WASM file not found: ${filePath}`);
  }

  const wasmBuffer = fs.readFileSync(filePath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const exports = WebAssembly.Module.exports(wasmModule);

  return exports
    .filter(exportDesc => exportDesc.kind === 'function')
    .map(exportDesc => exportDesc.name);
}

function compareExports(actualExports) {
  const userExports = actualExports.filter(name => !name.startsWith('__'));
  const missingExports = EXPECTED_EXPORTS.filter(
    name => !actualExports.includes(name),
  );
  const unexpectedExports = userExports.filter(
    name => !EXPECTED_EXPORTS.includes(name),
  );

  return { userExports, missingExports, unexpectedExports };
}

function printAnalysis(label, actualExports, comparison) {
  console.log(`\n${label.toUpperCase()} WASM`);
  console.log(`Total exports: ${actualExports.length}`);
  console.log(`User-defined exports: ${comparison.userExports.length}`);

  if (comparison.missingExports.length > 0) {
    console.log(`Missing exports (${comparison.missingExports.length}):`);
    for (const name of comparison.missingExports) {
      console.log(`  - ${name}`);
    }
  } else {
    console.log('All expected exports are present.');
  }

  if (comparison.unexpectedExports.length > 0) {
    console.log(`Unexpected exports (${comparison.unexpectedExports.length}):`);
    for (const name of comparison.unexpectedExports) {
      console.log(`  - ${name}`);
    }
  }
}

async function main() {
  console.log('Checking WebAssembly exports...');

  const debugExports = await analyzeWasmExports(DEBUG_WASM_PATH);
  const debugComparison = compareExports(debugExports);
  printAnalysis('debug', debugExports, debugComparison);

  const releaseExports = await analyzeWasmExports(RELEASE_WASM_PATH);
  const releaseComparison = compareExports(releaseExports);
  printAnalysis('release', releaseExports, releaseComparison);

  if (
    debugComparison.missingExports.length > 0 ||
    releaseComparison.missingExports.length > 0
  ) {
    console.error('\nWASM export validation failed.');
    process.exit(1);
  }

  console.log('\nWASM export validation passed.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
