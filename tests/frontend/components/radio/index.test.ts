jest.mock('../../../../src/components/radio/MarineRadio', () => ({
  MarineRadio: 'MarineRadioMock',
}));

import { MarineRadio } from '../../../../src/components/radio';

describe('components/radio barrel', () => {
  it('re-exports MarineRadio', () => {
    expect(MarineRadio).toBe('MarineRadioMock');
  });
});
