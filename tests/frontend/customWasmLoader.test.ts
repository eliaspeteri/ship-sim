describe('customWasmLoader', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error - allow cleanup when fetch is undefined
      delete global.fetch;
    }
    jest.clearAllMocks();
  });

  it('loads and caches the module in development mode', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    global.fetch = fetchMock as typeof fetch;

    const exports: any = {
      __setArgumentsLength: jest.fn(),
      updateVesselState: jest.fn().mockReturnValue(99),
      createVessel: jest.fn().mockReturnValue(77),
      getVesselParamsBufferPtr: jest.fn().mockReturnValue(0),
      getVesselParamsBufferCapacity: jest.fn().mockReturnValue(0),
      setVesselParams: jest.fn(),
      getEnvironmentBufferPtr: jest.fn().mockReturnValue(0),
      getEnvironmentBufferCapacity: jest.fn().mockReturnValue(0),
      setEnvironment: jest.fn(),
      setThrottle: jest.fn(),
      setRudderAngle: jest.fn(),
      setBallast: jest.fn(),
      getVesselX: jest.fn(),
      getVesselY: jest.fn(),
      getVesselZ: jest.fn(),
      getVesselHeading: jest.fn(),
      getVesselSpeed: jest.fn(),
      getVesselEngineRPM: jest.fn(),
      getVesselFuelLevel: jest.fn(),
      getVesselFuelConsumption: jest.fn(),
      getVesselGM: jest.fn(),
      getVesselCenterOfGravityY: jest.fn(),
      getVesselRollAngle: jest.fn(),
      getVesselPitchAngle: jest.fn(),
      getVesselRudderAngle: jest.fn(),
      getVesselBallastLevel: jest.fn(),
      getVesselSurgeVelocity: jest.fn(),
      getVesselSwayVelocity: jest.fn(),
      getVesselHeaveVelocity: jest.fn(),
      getVesselRollRate: jest.fn(),
      getVesselPitchRate: jest.fn(),
      getVesselYawRate: jest.fn(),
      calculateSeaState: jest.fn(),
      getWaveHeightForSeaState: jest.fn(),
      resetGlobalVessel: jest.fn(),
      destroyVessel: jest.fn(),
    };

    let capturedImports: any = null;
    const compileSpy = jest
      .spyOn(WebAssembly, 'compile')
      .mockResolvedValue({} as WebAssembly.Module);
    const instantiateSpy = jest
      .spyOn(WebAssembly, 'instantiate')
      .mockImplementation(async (_module, imports) => {
        capturedImports = imports;
        return { exports } as WebAssembly.Instance;
      });

    const { loadWasmModule } = require('../../src/lib/customWasmLoader');
    const first = await loadWasmModule();
    const second = await loadWasmModule();

    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledWith('/wasm/debug.wasm');
    expect(compileSpy).toHaveBeenCalled();
    expect(instantiateSpy).toHaveBeenCalled();

    expect(first.updateVesselState(1, 0.1, 1, 2, 3, 4, 5, 6, 7, 8)).toBe(99);
    expect(
      first.createVessel(
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
      ),
    ).toBe(77);

    expect(exports.__setArgumentsLength).toHaveBeenCalledWith(10);
    expect(exports.__setArgumentsLength).toHaveBeenCalledWith(32);

    const abort = capturedImports?.env?.abort as (
      messagePtr: number,
      filePtr: number,
      line: number,
      column: number,
    ) => void;
    const memory = capturedImports?.env?.memory as WebAssembly.Memory;
    const buffer = new Uint16Array(memory.buffer);
    const writeUtf16 = (ptr: number, value: string) => {
      const lenIndex = (ptr - 2) >>> 1;
      buffer[lenIndex] = value.length;
      for (let i = 0; i < value.length; i += 1) {
        buffer[(ptr >>> 1) + i] = value.charCodeAt(i);
      }
    };
    writeUtf16(16, 'Oops');
    writeUtf16(32, 'file.ts');
    expect(() => abort(16, 32, 1, 2)).toThrow(
      /AssemblyScript abort: Oops at file\.ts:1:2/,
    );

    compileSpy.mockRestore();
    instantiateSpy.mockRestore();
  });

  it('throws when fetch fails in production mode', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Boom',
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    global.fetch = fetchMock as typeof fetch;

    const { loadWasmModule } = require('../../src/lib/customWasmLoader');
    await expect(loadWasmModule()).rejects.toThrow(
      'Failed to fetch WASM module from /wasm/ship_sim.wasm: 500 Boom',
    );
  });
});
