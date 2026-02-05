/** @jest-environment node */
import { getApiBase } from '../../../src/lib/api';

const originalEnv = { ...process.env };

const resetEnv = () => {
  Object.keys(process.env).forEach(key => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.entries(originalEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

afterEach(() => {
  resetEnv();
  delete (globalThis as { window?: unknown }).window;
});

describe('getApiBase', () => {
  it('uses NEXT_PUBLIC_SERVER_URL and trims trailing slash', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com/';
    expect(getApiBase()).toBe('https://example.com');
  });

  it('falls back to NEXT_PUBLIC_SOCKET_URL when server url is missing', () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL;
    process.env.NEXT_PUBLIC_SOCKET_URL = 'http://socket.test/';
    expect(getApiBase()).toBe('http://socket.test');
  });

  it('builds from window location when no env base is present', () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL;
    delete process.env.NEXT_PUBLIC_SOCKET_URL;
    process.env.NEXT_PUBLIC_SERVER_PORT = '4000';
    (
      globalThis as {
        window?: { location: { protocol: string; hostname: string } };
      }
    ).window = {
      location: { protocol: 'https:', hostname: 'ship.local' },
    };

    expect(getApiBase()).toBe('https://ship.local:4000');
  });

  it('defaults to localhost when no window is available', () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL;
    delete process.env.NEXT_PUBLIC_SOCKET_URL;
    delete process.env.NEXT_PUBLIC_SERVER_PORT;

    expect(getApiBase()).toBe('http://localhost:3001');
  });
});
