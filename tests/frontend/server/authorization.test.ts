/** @jest-environment node */
import {
  hasPermission,
  requirePermission,
  requireRole,
  socketHasPermission,
  createSocketPermissionMiddleware,
} from '../../../src/server/middleware/authorization';

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

describe('authorization middleware', () => {
  it('hasPermission checks specific, manage, and admin wildcards', () => {
    const perms = [
      { resource: 'vessel', action: 'list' },
      { resource: 'mission', action: 'manage' },
    ];

    expect(hasPermission(perms, 'vessel', 'list')).toBe(true);
    expect(hasPermission(perms, 'mission', 'update')).toBe(true);
    expect(hasPermission(perms, 'economy', 'read')).toBe(false);

    expect(
      hasPermission([{ resource: '*', action: '*' }], 'any', 'thing'),
    ).toBe(true);
  });

  it('requirePermission returns 401 when no user', () => {
    const req = {} as any;
    const res = makeRes();
    const next = jest.fn();

    requirePermission('vessel', 'list')(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('requirePermission calls next when permitted', () => {
    const req = {
      user: { permissions: [{ resource: 'vessel', action: 'list' }] },
    } as any;
    const res = makeRes();
    const next = jest.fn();

    requirePermission('vessel', 'list')(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('requirePermission returns 403 when forbidden', () => {
    const req = {
      user: { permissions: [{ resource: 'vessel', action: 'list' }] },
    } as any;
    const res = makeRes();
    const next = jest.fn();

    requirePermission('vessel', 'update')(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'You do not have permission to perform this action',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole enforces roles', () => {
    const res = makeRes();
    const next = jest.fn();

    requireRole(['admin'])(
      { user: { roles: ['player'] } } as any,
      res as any,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(403);

    res.status.mockClear();
    res.json.mockClear();
    next.mockClear();

    requireRole(['player', 'admin'])(
      { user: { roles: ['player'] } } as any,
      res as any,
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('socketHasPermission checks socket data', () => {
    const socket = {
      data: { permissions: [{ resource: 'chat', action: 'send' }] },
    } as any;
    expect(socketHasPermission(socket, 'chat', 'send')).toBe(true);
    expect(socketHasPermission(socket, 'chat', 'read')).toBe(false);
    expect(socketHasPermission({ data: {} } as any, 'chat', 'send')).toBe(
      false,
    );
  });

  it('createSocketPermissionMiddleware validates permissions', () => {
    const next = jest.fn();
    const middleware = createSocketPermissionMiddleware('mission', 'assign');

    middleware({ data: null } as any, next);
    expect(next).toHaveBeenCalledWith(new Error('Authentication required'));

    next.mockClear();
    middleware(
      {
        data: { permissions: [{ resource: 'mission', action: 'assign' }] },
      } as any,
      next,
    );
    expect(next).toHaveBeenCalledWith();

    next.mockClear();
    middleware(
      {
        data: { permissions: [{ resource: 'mission', action: 'list' }] },
      } as any,
      next,
    );
    expect(next).toHaveBeenCalledWith(new Error('Insufficient permissions'));
  });
});
