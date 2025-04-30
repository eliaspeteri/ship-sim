module.exports = {
  // test related code folder
  include: ['assembly', 'tests'],
  exclude: [],

  /** optional: assemblyscript compile flag */
  flags:
    '--exportStart _start --importMemory --initialMemory 16 --maximumMemory 100',

  /**
   * optional: import functions
   * @param {ImportsArgument} runtime
   * @returns
   */
  imports(runtime) {
    return {
      env: {
        memory: new WebAssembly.Memory({
          initial: 16,
          maximum: 100,
        }),
        logInfo(ptr) {
          if (runtime.exports) {
            let arrbuf = runtime.exports.__getArrayBuffer(ptr);
            let str = Buffer.from(arrbuf).toString('utf8');
            console.info(str);
          }
        },
      },
      builtin: {
        getU8FromLinkedMemory() {
          return 1;
        },
      },
    };
  },

  /**  optional: template file path, default "coverage" */
  // temp: "coverage",

  /**  optional: report file path, default "coverage" */
  output: 'coverage',

  /** optional: test result output format, default "table" */
  mode: ['html', 'json', 'table'],
};
