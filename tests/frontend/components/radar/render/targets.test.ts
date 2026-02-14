import { ARPATargetStatus } from '../../../../../src/components/radar/arpa';
import {
  getArpaTargetColor,
  isTargetInGuardZone,
} from '../../../../../src/components/radar/render/targets';

describe('radar render target helpers', () => {
  it('detects targets inside wrapped guard-zone angles', () => {
    const guardZone = {
      active: true,
      startAngle: 320,
      endAngle: 40,
      innerRange: 0.5,
      outerRange: 3,
    };

    expect(
      isTargetInGuardZone(guardZone, { bearing: 350, distance: 1.2 }),
    ).toBe(true);
    expect(isTargetInGuardZone(guardZone, { bearing: 20, distance: 2.2 })).toBe(
      true,
    );
    expect(isTargetInGuardZone(guardZone, { bearing: 90, distance: 1.2 })).toBe(
      false,
    );
    expect(
      isTargetInGuardZone(guardZone, { bearing: 350, distance: 4.2 }),
    ).toBe(false);
  });

  it('maps ARPA statuses to stable colors', () => {
    expect(getArpaTargetColor(ARPATargetStatus.DANGEROUS)).toBe('#FF3333');
    expect(getArpaTargetColor(ARPATargetStatus.LOST)).toBe('#888888');
    expect(getArpaTargetColor(ARPATargetStatus.ACQUIRING)).toBe('#FFAA33');
    expect(getArpaTargetColor(ARPATargetStatus.TRACKING)).toBe('#55FF55');
  });
});
