import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import VesselCallout from '../../../src/components/VesselCallout';

jest.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="html-wrapper">{children}</div>
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('VesselCallout', () => {
  const originalPointerEvent = window.PointerEvent;

  beforeAll(() => {
    (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
      window.MouseEvent as unknown as typeof PointerEvent;
  });

  afterAll(() => {
    (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
      originalPointerEvent as typeof PointerEvent;
  });

  it('renders title, rows, link, and actions', () => {
    const onClose = jest.fn();
    const onOffsetChange = jest.fn();
    const action = jest.fn();

    render(
      <VesselCallout
        vesselId="v-1"
        title="Sea Breeze"
        position={{ x: 1, y: 2, z: 3 }}
        rows={[
          { label: 'Speed', value: '12 kt' },
          { label: 'Status', value: 'Docked' },
        ]}
        offset={{ x: 10, y: 20 }}
        onOffsetChange={onOffsetChange}
        onClose={onClose}
        actions={[{ label: 'Signal', onClick: action, variant: 'ghost' }]}
      />,
    );

    expect(screen.getByText('Sea Breeze')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('12 kt')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Docked')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Go to vessel page/i });
    expect(link).toHaveAttribute('href', '/vessels/v-1');

    fireEvent.click(screen.getByText('Signal'));
    expect(action).toHaveBeenCalled();
  });

  it('handles close and drag offset updates', () => {
    const onClose = jest.fn();
    const onOffsetChange = jest.fn();

    render(
      <VesselCallout
        vesselId="v-2"
        title="Driftwood"
        position={{ x: 0, y: 0, z: 0 }}
        rows={[]}
        offset={{ x: 5, y: 6 }}
        onOffsetChange={onOffsetChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'x' }));
    expect(onClose).toHaveBeenCalled();

    const header = screen.getByText('Driftwood').parentElement as HTMLElement;
    fireEvent.pointerDown(header, { clientX: 10, clientY: 10 });

    fireEvent.pointerMove(window, { clientX: 30, clientY: 45 });
    fireEvent.pointerUp(window);

    expect(onOffsetChange).toHaveBeenCalledWith({ x: 25, y: 41 });
  });
});
