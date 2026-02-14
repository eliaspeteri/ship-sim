describe('wasmLoader', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads wasm once and caches the bridge', async () => {
    jest.resetModules();
    const loadWasmModule = jest.fn().mockResolvedValue({ answer: 42 });
    const setWasmExports = jest.fn();

    jest.doMock('../../src/lib/customWasmLoader', () => ({
      __esModule: true,
      loadWasmModule,
    }));
    jest.doMock('../../src/store', () => {
      const useStore = () => ({ setWasmExports });
      (useStore as unknown as { getState: () => unknown }).getState = () => ({
        setWasmExports,
      });
      return { __esModule: true, default: useStore };
    });

    const { loadWasm } = require('../../src/lib/wasmLoader');
    const first = await loadWasm();
    const second = await loadWasm();

    expect(first).toBe(second);
    expect(loadWasmModule).toHaveBeenCalledTimes(1);
    expect(setWasmExports).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: 42,
        __pin: expect.any(Function),
        __unpin: expect.any(Function),
        __collect: expect.any(Function),
        __getArray: expect.any(Function),
        __getArrayView: expect.any(Function),
      }),
    );

    const exported = setWasmExports.mock.calls[0][0];
    exported.__getArray();
    exported.__getArrayView();
    expect(console.warn).toHaveBeenCalled();
  });

  it('bubbles errors when wasm loading fails', async () => {
    jest.resetModules();
    const loadWasmModule = jest.fn().mockRejectedValue(new Error('fail'));

    jest.doMock('../../src/lib/customWasmLoader', () => ({
      __esModule: true,
      loadWasmModule,
    }));
    jest.doMock('../../src/store', () => {
      const useStore = () => ({});
      (useStore as unknown as { getState: () => unknown }).getState =
        () => ({});
      return { __esModule: true, default: useStore };
    });

    const { loadWasm } = require('../../src/lib/wasmLoader');
    await expect(loadWasm()).rejects.toThrow('fail');
    expect(console.error).toHaveBeenCalled();
  });
});
