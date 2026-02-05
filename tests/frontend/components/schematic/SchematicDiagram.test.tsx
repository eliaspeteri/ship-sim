import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SchematicDiagram,
  SchematicComponent,
  SchematicConnection,
} from '../../../../src/components/schematic/SchematicDiagram';

describe('SchematicDiagram', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const components: SchematicComponent[] = [
    {
      id: 'pump-1',
      type: 'pump',
      x: 20,
      y: 30,
      label: 'Pump A',
      isActive: true,
    },
    {
      id: 'tank-1',
      type: 'tank',
      x: 120,
      y: 80,
      label: 'Tank B',
      isActive: false,
    },
  ];

  const connections: SchematicConnection[] = [
    {
      id: 'pipe-1',
      fromId: 'pump-1',
      toId: 'tank-1',
      type: 'pipe',
      isActive: true,
    },
  ];

  it('renders components and handles clicks', () => {
    const onComponentClick = jest.fn();
    const onConnectionClick = jest.fn();

    const { container } = render(
      <SchematicDiagram
        components={components}
        connections={connections}
        onComponentClick={onComponentClick}
        onConnectionClick={onConnectionClick}
      />,
    );

    fireEvent.click(screen.getByText('Pump A'));
    expect(onComponentClick).toHaveBeenCalledWith('pump-1');

    const connectionPath = container.querySelector('path');
    expect(connectionPath).toBeTruthy();
    fireEvent.click(connectionPath as SVGPathElement);
    expect(onConnectionClick).toHaveBeenCalledWith('pipe-1');
  });

  it('allows dragging components in edit mode', () => {
    const onComponentMove = jest.fn();

    jest
      .spyOn(SVGSVGElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        left: 0,
        top: 0,
        right: 400,
        bottom: 300,
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect);

    const { container } = render(
      <SchematicDiagram
        components={components}
        connections={connections}
        isEditable
        onComponentMove={onComponentMove}
      />,
    );

    const pumpLabel = screen.getByText('Pump A');
    const pumpGroup = pumpLabel.closest('g') as SVGGElement;
    const svg = container.querySelector('svg') as SVGSVGElement;

    fireEvent.mouseDown(pumpGroup, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(svg, { clientX: 30, clientY: 50 });

    expect(onComponentMove).toHaveBeenCalledWith('pump-1', 40, 70);
  });
});
