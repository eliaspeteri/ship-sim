import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import EditorToolsPanel from '../../../../../src/features/editor/components/EditorToolsPanel';

describe('EditorToolsPanel', () => {
  const tools = [
    { id: 'select', label: 'Select', key: '1', icon: 'S' },
    { id: 'draw', label: 'Draw', key: '2', icon: 'D' },
  ] as const;

  it('renders open panel and selects tools', () => {
    const onToggle = jest.fn();
    const onSelectTool = jest.fn();

    render(
      <EditorToolsPanel
        tools={tools}
        activeTool="select"
        isOpen
        onToggle={onToggle}
        onSelectTool={onSelectTool}
      />,
    );

    expect(screen.getByText('Tools')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse tools panel' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'D 2' }));

    expect(onToggle).toHaveBeenCalled();
    expect(onSelectTool).toHaveBeenCalledWith('draw');
  });

  it('renders collapsed panel', () => {
    render(
      <EditorToolsPanel
        tools={tools}
        activeTool="draw"
        isOpen={false}
        onToggle={jest.fn()}
        onSelectTool={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Expand tools panel' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
  });
});
