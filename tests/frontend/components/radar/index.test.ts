jest.mock('../../../../src/components/radar/RadarDisplay', () => ({
  __esModule: true,
  default: 'RadarDisplayMock',
}));

jest.mock('../../../../src/components/radar/RadarControls', () => ({
  __esModule: true,
  default: 'RadarControlsMock',
}));

jest.mock('../../../../src/components/radar/ARPAPanel', () => ({
  __esModule: true,
  default: 'ARPAPanelMock',
}));

import * as radar from '../../../../src/components/radar';

describe('components/radar barrel', () => {
  it('re-exports primary radar components', () => {
    expect(radar.RadarDisplay).toBe('RadarDisplayMock');
    expect(radar.RadarControls).toBe('RadarControlsMock');
    expect(radar.ARPAPanel).toBe('ARPAPanelMock');
  });
});
