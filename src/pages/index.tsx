import { useEffect, useState, useRef } from 'react';
import { loadWasm } from '../lib/wasmLoader';
import Scene from '../components/Scene';

const Home = () => {
  interface WasmModule {
    // Basic test functions
    add: (a: number, b: number) => number;
    multiply: (a: number, b: number) => number;

    // Vessel physics functions
    createVessel: () => number;
    updateVesselState: (
      vesselPtr: number,
      dt: number,
      windSpeed?: number,
      windDirection?: number,
    ) => number;
    setThrottle: (vesselPtr: number, throttle: number) => void;
    setRudderAngle: (vesselPtr: number, angle: number) => void;
    getVesselX: (vesselPtr: number) => number;
    getVesselY: (vesselPtr: number) => number;
    getVesselHeading: (vesselPtr: number) => number;
    getVesselSpeed: (vesselPtr: number) => number;
  }

  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [vesselPtr, setVesselPtr] = useState<number | null>(null);
  const [vesselPosition, setVesselPosition] = useState({
    x: 0,
    y: 0,
    heading: 0,
  });
  const [vesselSpeed, setVesselSpeed] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [rudderAngle, setRudderAngle] = useState(0);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Load WASM module
  useEffect(() => {
    const initWasm = async () => {
      const module = await loadWasm();
      setWasmModule(module);

      // Create vessel once WASM is loaded
      if (module) {
        const ptr = module.createVessel();
        setVesselPtr(ptr);
      }
    };

    initWasm();

    return () => {
      // Clean up animation frame on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Start physics simulation when vessel is created
  useEffect(() => {
    if (!wasmModule || vesselPtr === null) return;

    const updateSimulation = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(updateSimulation);
        return;
      }

      // Calculate delta time (capped at 100ms to avoid huge jumps)
      const dt = Math.min(0.1, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      // Update vessel physics - note we keep using the same vesselPtr
      wasmModule.updateVesselState(vesselPtr, dt);

      // Get updated vessel state (from the same pointer)
      const x = wasmModule.getVesselX(vesselPtr);
      const y = wasmModule.getVesselY(vesselPtr);
      const heading = wasmModule.getVesselHeading(vesselPtr);
      const speed = wasmModule.getVesselSpeed(vesselPtr);

      setVesselPosition({ x, y, heading });
      setVesselSpeed(speed);

      animationRef.current = requestAnimationFrame(updateSimulation);
    };

    animationRef.current = requestAnimationFrame(updateSimulation);
  }, [wasmModule, vesselPtr]);

  // Handle throttle changes
  const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThrottle = parseFloat(e.target.value);
    setThrottle(newThrottle);

    // Apply directly to WASM if it's loaded
    if (wasmModule && vesselPtr !== null) {
      console.log('Setting throttle to:', newThrottle);
      wasmModule.setThrottle(vesselPtr, newThrottle);
    }
  };

  // Handle rudder changes
  const handleRudderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRudder = parseFloat(e.target.value);
    setRudderAngle(newRudder);

    // Apply directly to WASM if it's loaded
    if (wasmModule && vesselPtr !== null) {
      console.log('Setting rudder to:', newRudder);
      wasmModule.setRudderAngle(vesselPtr, newRudder);
    }
  };

  return (
    <div className="h-screen w-full">
      <Scene vesselPosition={vesselPosition} />

      {/* Simple controls */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center space-x-4 bg-black bg-opacity-50 p-4 text-white">
        <div>
          <p>Speed: {vesselSpeed.toFixed(2)} m/s</p>
          <p>
            Position: ({vesselPosition.x.toFixed(1)},{' '}
            {vesselPosition.y.toFixed(1)})
          </p>
          <p>
            Heading: {((vesselPosition.heading * 180) / Math.PI).toFixed(1)}°
          </p>
        </div>

        <div>
          <label>
            Throttle:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={throttle}
              onChange={handleThrottleChange}
              className="ml-2"
            />
            {(throttle * 100).toFixed(0)}%
          </label>
        </div>

        <div>
          <label>
            Rudder:
            <input
              type="range"
              min="-0.6"
              max="0.6"
              step="0.01"
              value={rudderAngle}
              onChange={handleRudderChange}
              className="ml-2"
            />
            {((rudderAngle * 180) / Math.PI).toFixed(0)}°
          </label>
        </div>

        <div>
          <p>
            <strong>Debug:</strong>
          </p>
          <p>Throttle set: {throttle.toFixed(2)}</p>
          <p>Rudder set: {rudderAngle.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
