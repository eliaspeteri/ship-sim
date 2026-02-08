import {
  ECONOMY_CONTEXTS,
  ECONOMY_DEFAULT_CONTEXT,
  getEconomyContext,
  isEconomyContext,
} from '../../../../src/features/economy/economyContexts';

describe('economyContexts', () => {
  it('exposes a valid default context', () => {
    expect(ECONOMY_DEFAULT_CONTEXT).toBe('shipyard');
    expect(isEconomyContext(ECONOMY_DEFAULT_CONTEXT)).toBe(true);
  });

  it('resolves known contexts and rejects unknown values', () => {
    const fleet = getEconomyContext('fleet');
    const missing = getEconomyContext('unknown');

    expect(fleet).toEqual(
      expect.objectContaining({
        id: 'fleet',
        label: 'Company Fleet',
        navLabel: 'Fleet',
      }),
    );
    expect(missing).toBeUndefined();
    expect(isEconomyContext('fleet')).toBe(true);
    expect(isEconomyContext('unknown')).toBe(false);
  });

  it('keeps context ids unique', () => {
    const ids = ECONOMY_CONTEXTS.map(context => context.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
