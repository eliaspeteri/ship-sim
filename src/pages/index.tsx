import { useEffect, useState } from 'react';
import { loadWasm } from '../lib/wasmLoader';

const Home = () => {
  interface WasmModule {
    add: (a: number, b: number) => number;
    multiply: (a: number, b: number) => number;
  }

  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);

  useEffect(() => {
    const initWasm = async () => {
      const module = await loadWasm();
      setWasmModule(module);
    };

    initWasm();
  }, []);

  const handleAdd = () => {
    if (wasmModule) {
      const result = wasmModule.add(5, 3);
      alert(`5 + 3 = ${result}`);
    }
  };

  const handleMultiply = () => {
    if (wasmModule) {
      const result = wasmModule.multiply(5, 3);
      alert(`5 * 3 = ${result}`);
    }
  };

  return (
    <div>
      <h1>Ship Simulation</h1>
      <button onClick={handleAdd}>Add</button>
      <button onClick={handleMultiply}>Multiply</button>
    </div>
  );
};

export default Home;
