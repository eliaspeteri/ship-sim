import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBoxContent } from '../../../../src/components/common/StatusBoxContent';
import type { ValueLine } from '../../../../src/components/common/StatusPanelTypes';

const renderBox = (
  overrides: Partial<React.ComponentProps<typeof StatusBoxContent>['box']> = {},
  data: Record<string, string | number | undefined> = {},
) => {
  const box = {
    id: 'spd',
    label: 'SPD',
    mainValue: { text: 'data:speed' },
    statusValue: { text: 'data:unit' },
    ...overrides,
  };
  return render(<StatusBoxContent box={box} data={data} />);
};

describe('StatusBoxContent', () => {
  it('renders label and resolves data values', () => {
    renderBox({}, { speed: 12.5, unit: 'kts' });

    expect(screen.getByText('SPD')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    expect(screen.getByText('kts')).toBeInTheDocument();
  });

  it('renders placeholders for missing data', () => {
    renderBox(
      { mainValue: { text: 'data:missing' }, statusValue: undefined },
      {},
    );

    expect(screen.getByText('{{missing}}')).toBeInTheDocument();
  });

  it('renders static text and additional lines', () => {
    renderBox(
      {
        mainValue: { text: 'STATIC' },
        statusValue: undefined,
        additionalLines: [{ text: 'data:detail' }, { text: 'Line 2' }],
      },
      { detail: '42' },
    );

    expect(screen.getByText('STATIC')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
  });

  it('renders status value in header for POSN box and ignores empty lines', () => {
    renderBox(
      {
        id: 'posn',
        label: 'POSN',
        mainValue: undefined,
        statusValue: { text: 'data:status' },
        additionalLines: [{ text: '' } as ValueLine],
      },
      { status: 'OK' },
    );

    expect(screen.getByText('POSN')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
