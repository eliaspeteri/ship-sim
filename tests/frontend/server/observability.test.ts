import {
  clearLogs,
  getLogs,
  recordLog,
} from '../../../src/server/observability';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'log-id'),
}));

describe('observability logs', () => {
  beforeEach(() => {
    clearLogs();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  it('records and retrieves logs with defaults', () => {
    recordLog({
      level: 'info',
      source: 'test',
      message: 'hello',
    });

    const logs = getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      id: 'log-id',
      timestamp: 1000,
      level: 'info',
      source: 'test',
      message: 'hello',
    });
  });

  it('filters logs by since and limit', () => {
    (Date.now as jest.Mock).mockReturnValue(1000);
    recordLog({
      level: 'info',
      source: 'test',
      message: 'first',
    });
    (Date.now as jest.Mock).mockReturnValue(2000);
    recordLog({
      level: 'warn',
      source: 'test',
      message: 'second',
    });

    const logs = getLogs({ since: 1500, limit: 1 });
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('second');
  });
});
