import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const runSmoke = process.env.SMOKE_E2E === 'true';
const webBase = process.env.SMOKE_WEB_BASE || 'http://localhost:3000';
const apiBase = process.env.SMOKE_API_BASE || 'http://localhost:3001';
const socketUrl = process.env.SMOKE_SOCKET_URL || apiBase;

const cookieJar = new Map();

const updateCookies = res => {
  const setCookie =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [];
  setCookie.forEach(raw => {
    const [pair] = raw.split(';');
    const [name, value] = pair.split('=');
    if (name && value !== undefined) {
      cookieJar.set(name, value);
    }
  });
};

const cookieHeader = () =>
  Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

test(
  'smoke: login -> start scenario -> move vessel',
  { skip: !runSmoke },
  async () => {
    const username = `pilot_${Date.now()}`;
    const password = `test_${Math.random().toString(36).slice(2, 8)}`;

    const registerRes = await fetch(`${webBase}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    updateCookies(registerRes);

    const csrfRes = await fetch(`${webBase}/api/auth/csrf`, {
      headers: { cookie: cookieHeader() },
    });
    updateCookies(csrfRes);
    const csrfData = await csrfRes.json();
    assert.ok(csrfData.csrfToken, 'csrf token should be present');

    const body = new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      username,
      password,
      redirect: 'false',
      json: 'true',
    });
    const loginRes = await fetch(`${webBase}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: cookieHeader(),
      },
      body,
    });
    updateCookies(loginRes);

    const sessionRes = await fetch(`${webBase}/api/auth/session`, {
      headers: { cookie: cookieHeader() },
    });
    const session = await sessionRes.json();
    const socketToken = session?.socketToken;
    const userId = session?.user?.id;
    assert.ok(socketToken, 'socket token should be present');
    assert.ok(userId, 'user id should be present');

    let spaceId = 'global';
    try {
      const scenarioRes = await fetch(
        `${apiBase}/api/scenarios/harbor-entry/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: cookieHeader(),
          },
        },
      );
      if (scenarioRes.ok) {
        const scenarioData = await scenarioRes.json();
        spaceId = scenarioData?.space?.id || spaceId;
      }
    } catch {
      spaceId = 'global';
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
      auth: {
        token: socketToken,
        spaceId,
        mode: 'player',
        autoJoin: true,
      },
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Socket connection timeout')),
        8000,
      );
      socket.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.once('connect_error', err => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    socket.emit('vessel:control', { throttle: 0.3, rudderAngle: 0 });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('No simulation update received')),
        8000,
      );
      socket.on('simulation:update', data => {
        const vessels = Object.values(data?.vessels || {});
        const owned = vessels.find(
          v =>
            v.ownerId === userId ||
            (Array.isArray(v.crewIds) && v.crewIds.includes(userId)),
        );
        if (owned && owned.controls?.throttle !== undefined) {
          clearTimeout(timeout);
          resolve();
        }
      });
      socket.on('error', err => {
        clearTimeout(timeout);
        reject(new Error(err));
      });
    });

    socket.disconnect();
  },
);
