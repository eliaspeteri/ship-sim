import * as switches from '../../../../src/components/switches';

describe('switches index', () => {
  it('exports switch components', () => {
    expect(switches.ToggleSwitch).toBeDefined();
    expect(switches.PushSwitch).toBeDefined();
    expect(switches.RockerSwitch).toBeDefined();
    expect(switches.ChangeoverSwitch).toBeDefined();
  });
});
