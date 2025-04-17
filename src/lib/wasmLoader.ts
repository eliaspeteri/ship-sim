export async function loadWasm() {
  const response = await fetch('/wasm/ship_sim.wasm');
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: {
      abort: (msg: string) => {
        console.error(`WASM abort: ${msg}`);
        throw new Error(msg);
      },
    },
  });
  return instance.exports as {
    add: (a: number, b: number) => number;
    multiply: (a: number, b: number) => number;
    // Add other exported functions here as needed
  };
}
