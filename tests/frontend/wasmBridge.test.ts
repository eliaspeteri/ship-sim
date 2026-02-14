import { WasmBridge } from '../../src/lib/wasmBridge';

type WasmModuleArg = ConstructorParameters<typeof WasmBridge>[0];

describe('WasmBridge', () => {
  it('writes vessel params into the wasm buffer', () => {
    const buffer = new ArrayBuffer(8 * 6);
    const wasmModule = {
      memory: { buffer },
      getVesselParamsBufferCapacity: jest.fn(() => 4),
      getVesselParamsBufferPtr: jest.fn(() => 8),
      setVesselParams: jest.fn(),
    } as unknown as WasmModuleArg;
    const bridge = new WasmBridge(wasmModule);

    bridge.setVesselParams(3, 7, [1, 2]);

    const view = new Float64Array(buffer, 8, 4);
    expect(view[0]).toBe(1);
    expect(view[1]).toBe(2);
    expect(Number.isNaN(view[2])).toBe(true);
    expect(Number.isNaN(view[3])).toBe(true);
    expect(wasmModule.setVesselParams).toHaveBeenCalledWith(3, 7, 8, 2);
  });

  it('writes environment params and respects capacity', () => {
    const buffer = new ArrayBuffer(8 * 4);
    const wasmModule = {
      memory: { buffer },
      getEnvironmentBufferCapacity: jest.fn(() => 2),
      getEnvironmentBufferPtr: jest.fn(() => 8),
      setEnvironment: jest.fn(),
    } as unknown as WasmModuleArg;
    const bridge = new WasmBridge(wasmModule);

    bridge.setEnvironment([9, 8, 7]);

    const view = new Float64Array(buffer, 8, 2);
    expect(view[0]).toBe(9);
    expect(view[1]).toBe(8);
    expect(wasmModule.setEnvironment).toHaveBeenCalledWith(8, 2);
  });

  it('no-ops when wasm buffer helpers are missing', () => {
    const wasmModule = {
      setVesselParams: jest.fn(),
    } as unknown as WasmModuleArg;
    const bridge = new WasmBridge(wasmModule);

    bridge.setVesselParams(1, 2, [1]);
    bridge.setEnvironment([1, 2]);

    expect(wasmModule.setVesselParams).not.toHaveBeenCalled();
  });

  it('uses destroyVessel when available, otherwise resetGlobalVessel', () => {
    const destroy = jest.fn();
    const reset = jest.fn();
    const bridgeA = new WasmBridge({
      destroyVessel: destroy,
    } as unknown as WasmModuleArg);
    const bridgeB = new WasmBridge({
      resetGlobalVessel: reset,
    } as unknown as WasmModuleArg);

    bridgeA.destroyVessel(10);
    bridgeB.destroyVessel(11);

    expect(destroy).toHaveBeenCalledWith(10);
    expect(reset).toHaveBeenCalled();
  });

  it('proxies passthrough methods to the wasm module', () => {
    const wasmModule = {
      updateVesselState: jest.fn().mockReturnValue(99),
      createVessel: jest.fn().mockReturnValue(7),
      setThrottle: jest.fn(),
      setRudderAngle: jest.fn(),
      setBallast: jest.fn(),
      getVesselX: jest.fn().mockReturnValue(1),
      getVesselY: jest.fn().mockReturnValue(2),
      getVesselZ: jest.fn().mockReturnValue(3),
      getVesselHeading: jest.fn().mockReturnValue(4),
      getVesselSpeed: jest.fn().mockReturnValue(5),
      getVesselRollAngle: jest.fn().mockReturnValue(6),
      getVesselPitchAngle: jest.fn().mockReturnValue(7),
      getVesselEngineRPM: jest.fn().mockReturnValue(8),
      getVesselFuelLevel: jest.fn().mockReturnValue(9),
      getVesselFuelConsumption: jest.fn().mockReturnValue(10),
      getVesselGM: jest.fn().mockReturnValue(11),
      getVesselCenterOfGravityY: jest.fn().mockReturnValue(12),
      getVesselRudderAngle: jest.fn().mockReturnValue(13),
      getVesselBallastLevel: jest.fn().mockReturnValue(14),
      getVesselSurgeVelocity: jest.fn().mockReturnValue(15),
      getVesselSwayVelocity: jest.fn().mockReturnValue(16),
      getVesselHeaveVelocity: jest.fn().mockReturnValue(17),
      getVesselRollRate: jest.fn().mockReturnValue(18),
      getVesselPitchRate: jest.fn().mockReturnValue(19),
      getVesselYawRate: jest.fn().mockReturnValue(20),
      calculateSeaState: jest.fn().mockReturnValue(21),
      getWaveHeightForSeaState: jest.fn().mockReturnValue(22),
    } as unknown as WasmModuleArg;
    const bridge = new WasmBridge(wasmModule);

    expect(bridge.updateVesselState(1, 0.1, 1, 2, 3, 4, 5, 6, 7, 8)).toBe(99);
    const input = {
      position: { x: 1, y: 2, z: 3 },
      orientation: { heading: 4, roll: 5, pitch: 6 },
      velocity: { surge: 7, sway: 8, heave: 9 },
      angularVelocity: { yaw: 10, roll: 11, pitch: 12 },
      controls: { throttle: 13, rudderAngle: 14 },
      properties: {
        mass: 15,
        length: 16,
        beam: 17,
        draft: 18,
        blockCoefficient: 19,
      },
      hydrodynamics: {
        rudderForceCoefficient: 20,
        rudderStallAngle: 21,
        rudderMaxAngle: 22,
        dragCoefficient: 23,
        yawDamping: 24,
        yawDampingQuad: 25,
        swayDamping: 26,
      },
      propulsion: { maxThrust: 27, maxSpeed: 28 },
      stability: {
        rollDamping: 29,
        pitchDamping: 30,
        heaveStiffness: 31,
        heaveDamping: 32,
      },
    };

    expect(bridge.createVesselFromInput(input)).toBe(7);
    expect(wasmModule.createVessel).toHaveBeenCalledWith(
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
    );

    bridge.setThrottle(1, 0.5);
    bridge.setRudderAngle(1, 0.2);
    bridge.setBallast(1, 0.3);

    expect(bridge.getVesselX(1)).toBe(1);
    expect(bridge.getVesselY(1)).toBe(2);
    expect(bridge.getVesselZ(1)).toBe(3);
    expect(bridge.getVesselHeading(1)).toBe(4);
    expect(bridge.getVesselSpeed(1)).toBe(5);
    expect(bridge.getVesselRollAngle(1)).toBe(6);
    expect(bridge.getVesselPitchAngle(1)).toBe(7);
    expect(bridge.getVesselEngineRPM(1)).toBe(8);
    expect(bridge.getVesselFuelLevel(1)).toBe(9);
    expect(bridge.getVesselFuelConsumption(1)).toBe(10);
    expect(bridge.getVesselGM(1)).toBe(11);
    expect(bridge.getVesselCenterOfGravityY(1)).toBe(12);
    expect(bridge.getVesselRudderAngle(1)).toBe(13);
    expect(bridge.getVesselBallastLevel(1)).toBe(14);
    expect(bridge.getVesselSurgeVelocity(1)).toBe(15);
    expect(bridge.getVesselSwayVelocity(1)).toBe(16);
    expect(bridge.getVesselHeaveVelocity(1)).toBe(17);
    expect(bridge.getVesselRollRate(1)).toBe(18);
    expect(bridge.getVesselPitchRate(1)).toBe(19);
    expect(bridge.getVesselYawRate(1)).toBe(20);
    expect(bridge.calculateSeaState(3)).toBe(21);
    expect(bridge.getWaveHeightForSeaState(4)).toBe(22);
  });
});
