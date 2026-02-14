import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import EditorWorkAreaEditor from '../../../../../src/features/editor/components/EditorWorkAreaEditor';

describe('EditorWorkAreaEditor', () => {
  it('shows empty state and adds a new work area', () => {
    const onChange = jest.fn();

    render(<EditorWorkAreaEditor workAreas={[]} onChange={onChange} />);

    expect(screen.getByText('No work areas defined yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0][0];
    expect(next.name).toBe('New Work Area');
    expect(next.bounds.type).toBe('bbox');
  });

  it('edits, focuses, locks and removes existing work area', () => {
    const onChange = jest.fn();
    const onFocusWorkArea = jest.fn();
    const workAreas = [
      {
        id: 'wa-1',
        name: 'Area 1',
        bounds: {
          type: 'bbox',
          minLat: 10,
          minLon: 20,
          maxLat: 10.2,
          maxLon: 20.2,
        },
        allowedZoom: [8, 14],
        sources: ['terrain', 'bathymetry'],
      },
    ] as Array<{
      id: string;
      name: string;
      bounds: {
        type: 'bbox';
        minLat: number;
        minLon: number;
        maxLat: number;
        maxLon: number;
      };
      allowedZoom: [number, number];
      sources: string[];
    }>;

    render(
      <EditorWorkAreaEditor
        workAreas={workAreas}
        onChange={onChange}
        onFocusWorkArea={onFocusWorkArea}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
    expect(onFocusWorkArea).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const nameInput = screen.getByDisplayValue('Area 1');
    fireEvent.change(nameInput, { target: { value: 'Area Renamed' } });

    const centerLatInput = screen.getByTitle('Center latitude (-90 to 90)');
    fireEvent.change(centerLatInput, { target: { value: '11.1' } });

    const sourceCheckbox = screen.getByRole('checkbox', { name: 'imagery' });
    fireEvent.click(sourceCheckbox);

    fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onChange).toHaveBeenCalled();
    const payloads = onChange.mock.calls.map(call => call[0]);
    expect(payloads.some((p: unknown[]) => p.length === 0)).toBe(true);
  });

  it('renders polygon bounds hint', () => {
    render(
      <EditorWorkAreaEditor
        workAreas={
          [
            {
              id: 'wa-poly',
              name: 'Polygon Area',
              bounds: {
                type: 'polygon',
                coordinates: [
                  [60, 24] as [number, number],
                  [60.1, 24.1] as [number, number],
                ],
              },
              allowedZoom: [8, 14],
              sources: ['terrain'],
            },
          ] as Array<{
            id: string;
            name: string;
            bounds: { type: 'polygon'; coordinates: [number, number][] };
            allowedZoom: [number, number];
            sources: string[];
          }>
        }
        onChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(
      screen.getByText('Polygon bounds editing is not implemented yet.'),
    ).toBeInTheDocument();
  });
});
