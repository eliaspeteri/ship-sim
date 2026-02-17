import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import EditorLayerList from '../../../../../src/features/editor/components/EditorLayerList';

describe('EditorLayerList', () => {
  it('renders layers and triggers actions', () => {
    const onMoveLayer = jest.fn();
    const onToggleLayerVisibility = jest.fn();
    const onToggleLayerLock = jest.fn();

    render(
      <EditorLayerList
        layers={[
          {
            id: 'l1',
            name: 'Layer 1',
            type: 'NavAidLayer',
            geometry: 'point',
            isVisible: true,
            isLocked: false,
          },
          {
            id: 'l2',
            name: 'Layer 2',
            type: 'SpeedZoneLayer',
            geometry: 'polygon',
            isVisible: false,
            isLocked: true,
          },
        ]}
        onMoveLayer={onMoveLayer}
        onToggleLayerVisibility={onToggleLayerVisibility}
        onToggleLayerLock={onToggleLayerLock}
      />,
    );

    expect(screen.getByText('Layer 1')).toBeInTheDocument();
    expect(screen.getByText('Layer 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hid' }));
    fireEvent.click(screen.getByRole('button', { name: 'Free' }));

    const upButtons = screen.getAllByRole('button', { name: '^' });
    const downButtons = screen.getAllByRole('button', { name: 'v' });

    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[1]).toBeDisabled();

    fireEvent.click(upButtons[1]);
    fireEvent.click(downButtons[0]);

    expect(onToggleLayerVisibility).toHaveBeenCalledWith('l1');
    expect(onToggleLayerVisibility).toHaveBeenCalledWith('l2');
    expect(onToggleLayerLock).toHaveBeenCalledWith('l1');
    expect(onToggleLayerLock).toHaveBeenCalledWith('l2');
    expect(onMoveLayer).toHaveBeenCalledWith('l2', 'up');
    expect(onMoveLayer).toHaveBeenCalledWith('l1', 'down');
  });
});
