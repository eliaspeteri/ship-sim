/**
 * Ship Simulator WASM Module Loader
 *
 * This file handles loading and initializing the AssemblyScript WASM module
 * that contains our physics simulation code.
 */

// Import our custom loader
import { loadWasmModule } from './customWasmLoader';
import { WasmModule } from '../types/wasm';
import { WasmBridge } from './wasmBridge';
import useStore from '../store';

// Cache the loaded module and bridge
let wasmModule: WasmModule | null = null;
let wasmBridge: WasmBridge | null = null;

/**
 * Load and initialize the WASM module
 */
export async function loadWasm(): Promise<WasmBridge> {
  if (wasmBridge) {
    console.info(
      'WASM physics engine already loaded, returning cached instance',
    );

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
    const setWasmExports = useStore.getState().setWasmExports;
    if (typeof setWasmExports === 'function') {
      setWasmExports(wasmModule);
    }
    return wasmBridge;
  } catch (error) {
    console.error('Failed to load WASM physics engine:', error);
    throw error;
  }
}
