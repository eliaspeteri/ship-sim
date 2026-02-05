import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}

const consoleSpies: Array<jest.SpyInstance> = [];

beforeAll(() => {
  consoleSpies.push(jest.spyOn(console, 'info').mockImplementation(() => {}));
  consoleSpies.push(jest.spyOn(console, 'warn').mockImplementation(() => {}));
  consoleSpies.push(jest.spyOn(console, 'error').mockImplementation(() => {}));
});

afterAll(() => {
  consoleSpies.forEach(spy => spy.mockRestore());
});
