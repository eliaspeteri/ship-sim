/**
 * WebAssembly Export Checker (TypeScript version)
 *
 * This script analyzes compiled WebAssembly modules to determine which functions are being exported.
 * It's particularly useful for validating that all intended AssemblyScript functions are properly
 * exported in the compiled output.
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for WebAssembly export descriptor
interface WasmExportDescriptor {
  name: string;
  kind: 'function' | 'global' | 'memory' | 'table';
}

// Paths to the WebAssembly modules
const DEBUG_WASM_PATH = path.join(
  path.dirname(__filename),
  '../build/debug.wasm',
);
const RELEASE_WASM_PATH = path.join(
  path.dirname(__filename),
  '../public/wasm/ship_sim.wasm',
);

// Define expected functions that should be exported
const EXPECTED_EXPORTS: string[] = [
  // Vessel management
  'createVessel',
  'updateVesselState',

  // Control functions
  'setThrottle',
  'setRudderAngle',
  'setBallast',
  'setWaveData',

  // Wave calculations
  'calculateWaveHeightAtPosition',
  'calculateWaveHeight',
  'getWaveHeight',
  'getWaveFrequency',
  'calculateBeaufortScale',

  // Vessel state access functions
  'getVesselX',
  'getVesselY',
  'getVesselZ',
  'getVesselHeading',
  'getVesselSpeed',
  'getVesselEngineRPM',
  'getVesselFuelLevel',
  'getVesselFuelConsumption',
  'getVesselGM',
  'getVesselCenterOfGravityY',

  // Motion-related functions
  'getVesselRollAngle',
  'getVesselPitchAngle',
  'getVesselWaveHeight',
  'getVesselWavePhase',
];

/**
 * Read and analyze a WebAssembly module to extract its exports
 * @param filePath - Path to the WebAssembly module
 * @returns Array of exported function names
 */
async function analyzeWasmExports(filePath: string): Promise<string[]> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }

    const wasmBuffer = fs.readFileSync(filePath);
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    const exports = WebAssembly.Module.exports(
      wasmModule,
    ) as WasmExportDescriptor[];

    // Filter to only include functions (exclude memory, tables, globals)
    const functionExports = exports
      .filter(exp => exp.kind === 'function')
      .map(exp => exp.name);

    return functionExports;
  } catch (error) {
    console.error(`Error analyzing WASM file ${filePath}:`, error);
    return [];
  }
}

/**
 * Result of comparing exports
 */
interface ExportComparison {
  userExports: string[];
  missingExports: string[];
  unexpectedExports: string[];
}

/**
 * Compare expected exports with actual exports and output the results
 * @param actualExports - List of function names actually exported
 * @param expectedExports - List of function names that should be exported
 * @returns Object containing missing and unexpected exports
 */
function compareExports(
  actualExports: string[],
  expectedExports: string[],
): ExportComparison {
  // Filter out internal/runtime exports that start with __
  const userExports = actualExports.filter(name => !name.startsWith('__'));

  // Find missing exports (expected but not found)
  const missingExports = expectedExports.filter(
    name => !actualExports.includes(name),
  );

  // Find unexpected exports (found but not expected)
  const unexpectedExports = userExports.filter(
    name => !expectedExports.includes(name),
  );

  return {
    userExports,
    missingExports,
    unexpectedExports,
  };
}

/**
 * Print the export analysis result in a human-readable format
 * @param type - Type of build (debug or release)
 * @param exports - List of exports
 * @param comparison - Result of compareExports
 */
function printAnalysis(
  type: string,
  exports: string[],
  comparison: ExportComparison,
): void {
  const { userExports, missingExports, unexpectedExports } = comparison;

  console.log(`\n\n======== ${type.toUpperCase()} WASM ANALYSIS ========`);
  console.log(`Total exports: ${exports.length}`);
  console.log(`User-defined exports: ${userExports.length}`);

  console.log('\nExported functions:');
  console.log(userExports.map(name => `  - ${name}`).join('\n'));

  if (missingExports.length > 0) {
    console.log(`\n⚠️  MISSING EXPORTS (${missingExports.length}):`);
    console.log(missingExports.map(name => `  - ${name}`).join('\n'));
  } else {
    console.log('\n✅ All expected functions are exported.');
  }

  if (unexpectedExports.length > 0) {
    console.log(`\nUnexpected exports (${unexpectedExports.length}):`);
    console.log(unexpectedExports.map(name => `  - ${name}`).join('\n'));
  }
}

/**
 * Find potential issues in the source file that might cause export problems
 * @param sourceFilePath - Path to the AssemblyScript source file
 * @param missingExports - List of exports that are missing
 * @returns Object containing issues found
 */
async function analyzeSourceIssues(
  sourceFilePath: string,
  missingExports: string[],
): Promise<Record<string, { lineNumber: number; issue: string }>> {
  try {
    if (!fs.existsSync(sourceFilePath)) {
      console.error(`Source file not found: ${sourceFilePath}`);
      return {};
    }

    const source = fs.readFileSync(sourceFilePath, 'utf8');
    const lines = source.split('\n');
    const issues: Record<string, { lineNumber: number; issue: string }> = {};

    // Check for each missing export
    for (const missingExport of missingExports) {
      // Look for the function definition
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Simple pattern matching - can be improved with proper AST parsing
        if (
          line.includes(`export function ${missingExport}`) ||
          line.includes(`export function* ${missingExport}`)
        ) {
          // Check for default parameters
          if (line.includes('=') && line.includes(')')) {
            issues[missingExport] = {
              lineNumber: i + 1,
              issue:
                'Function has default parameters, which AssemblyScript cannot export',
            };
          }
          // Check for arrays in return type
          else if (line.includes('[]') && line.includes('):')) {
            issues[missingExport] = {
              lineNumber: i + 1,
              issue: 'Function returns an array, which may cause export issues',
            };
          }
          // Check for complex return types
          else if (
            !line.includes(': void') &&
            !line.includes(': f64') &&
            !line.includes(': f32') &&
            !line.includes(': i32') &&
            !line.includes(': i64') &&
            !line.includes(': u32') &&
            !line.includes(': u64') &&
            !line.includes(': usize') &&
            !line.includes(': bool')
          ) {
            issues[missingExport] = {
              lineNumber: i + 1,
              issue: 'Function may have a complex return type',
            };
          }
          // Check if it's missing @external annotation
          else if (!lines[i - 1]?.includes('@external')) {
            issues[missingExport] = {
              lineNumber: i + 1,
              issue: 'Function may need an @external annotation',
            };
          }

          break;
        }
      }

      // If no specific issue found, mark as unknown
      if (!issues[missingExport]) {
        issues[missingExport] = {
          lineNumber: -1,
          issue:
            'Unknown issue - function might be optimized out during compilation',
        };
      }
    }

    return issues;
  } catch (error) {
    console.error('Error analyzing source issues:', error);
    return {};
  }
}

/**
 * Main function that runs the analysis on both debug and release builds
 */
async function main(): Promise<void> {
  console.log('Checking WebAssembly exports...');

  try {
    // Analyze debug build
    console.log(`\nAnalyzing debug build: ${DEBUG_WASM_PATH}`);
    const debugExports = await analyzeWasmExports(DEBUG_WASM_PATH);
    const debugComparison = compareExports(debugExports, EXPECTED_EXPORTS);
    printAnalysis('debug', debugExports, debugComparison);

    // Analyze release build
    console.log(`\nAnalyzing release build: ${RELEASE_WASM_PATH}`);
    const releaseExports = await analyzeWasmExports(RELEASE_WASM_PATH);
    const releaseComparison = compareExports(releaseExports, EXPECTED_EXPORTS);
    printAnalysis('release', releaseExports, releaseComparison);

    // If there are missing exports, analyze source code for issues
    if (releaseComparison.missingExports.length > 0) {
      console.log('\n🔍 Analyzing source code for potential issues...');
      const sourceIssues = await analyzeSourceIssues(
        path.join(path.dirname(__filename), '../assembly/index.ts'),
        releaseComparison.missingExports,
      );

      if (Object.keys(sourceIssues).length > 0) {
        console.log('\nPotential issues found:');
        for (const [funcName, { lineNumber, issue }] of Object.entries(
          sourceIssues,
        )) {
          const lineInfo = lineNumber > 0 ? `Line ${lineNumber}: ` : '';
          console.log(`  - ${funcName}: ${lineInfo}${issue}`);
        }
      }
    }

    // Output final assessment
    if (
      debugComparison.missingExports.length > 0 ||
      releaseComparison.missingExports.length > 0
    ) {
      console.log('\n⚠️  EXPORT ISSUES DETECTED');
      console.log('\nPossible causes:');
      console.log(
        '1. Functions with default parameters (not supported by AssemblyScript exports)',
      );
      console.log('2. Functions returning complex types like arrays');
      console.log('3. Functions optimized out during compilation');
      console.log('\nRecommended fixes:');
      console.log('1. Remove default parameters from exported functions');
      console.log('2. Add @external JSDoc annotation to exported functions');
      console.log('3. Use simpler return types for exported functions');
      process.exit(1); // Exit with error code
    } else {
      console.log('\n✅ All WebAssembly exports validated successfully!');
    }
  } catch (error) {
    console.error(
      'Error during WebAssembly export analysis:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Execute the script
main();
