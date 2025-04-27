/**
 * Ship Simulator WASM Module Loader
 *
 * This file handles loading and initializing the AssemblyScript WASM module
 * that contains our physics simulation code.
 */

// Import our custom loader
import { loadWasmModule, unloadWasmModule } from './customWasmLoader';
import { WasmModule } from '../types/wasm';
import { WasmBridge } from './wasmBridge';

// Cache the loaded module and bridge
let wasmModule: WasmModule | null = null;
let wasmBridge: WasmBridge | null = null;

/**
 * Load and initialize the WASM module
 */
export async function loadWasm(): Promise<WasmBridge> {
  if (wasmBridge) {
    return wasmBridge;
  }

  try {
    // Use our custom loader instead of the auto-generated one
    const exports = await loadWasmModule();

    // Add compatibility layer for functions that expect the full WasmModule interface
    const enhancedExports = {
      ...exports,

      // Add stub implementations for any missing AssemblyScript runtime functions
      // that might be expected by the rest of the application
      __pin: exports.__pin || ((ptr: number) => ptr),
      __unpin: exports.__unpin || (() => undefined),
      __collect: exports.__collect || (() => undefined),

      // Array handling stubs
      __getArray: () => {
        console.warn('__getArray called but not implemented in custom loader');
        return [];
      },

      __getArrayView: () => {
        console.warn(
          '__getArrayView called but not implemented in custom loader',
        );
        return new Uint8Array(0);
      },
    } as unknown as WasmModule;

    // Cache the module for future use
    wasmModule = enhancedExports;

    // Create and cache our bridge that implements missing functions
    wasmBridge = new WasmBridge(wasmModule);

    console.info('WASM physics engine loaded and enhanced successfully');
    return wasmBridge;
  } catch (error) {
    console.error('Failed to load WASM physics engine:', error);
    throw error;
  }
}

/**
 * Cleanup WASM resources when no longer needed
 */
export function cleanupWasm() {
  if (wasmModule) {
    unloadWasmModule();
    wasmModule = null;
    wasmBridge = null;
  }
}

/**
 * Helper function to convert JS arrays to WASM memory
 * Note: This is a stub function since we're not using the full AssemblyScript runtime
 */
export function arrayToWasm<T>(
  _module: WasmModule,
  _array: T[],
  _createArrayFn: (length: number) => number,
): number {
  console.warn('arrayToWasm called but not implemented with custom loader');
  return 0;
}

/**
 * Helper function to retrieve arrays from WASM memory
 * Note: This is a stub function since we're not using the full AssemblyScript runtime
 */
export function wasmToArray<T>(_module: WasmModule, _ptr: number): T[] {
  console.warn('wasmToArray called but not implemented with custom loader');
  return [] as T[];
}
