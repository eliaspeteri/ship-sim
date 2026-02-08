import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import EditorInspectorPanel from '../../../../../src/features/editor/components/EditorInspectorPanel';

jest.mock(
  '../../../../../src/features/editor/components/EditorLayerList',
  () => {
    function EditorLayerListMock() {
      return <div>Editor Layer List Mock</div>;
    }
    return {
      __esModule: true,
      default: EditorLayerListMock,
    };
  },
);

jest.mock(
  '../../../../../src/features/editor/components/EditorWorkAreaEditor',
  () => {
    function EditorWorkAreaEditorMock() {
      return <div>Editor Work Area Editor Mock</div>;
    }
    return {
      __esModule: true,
      default: EditorWorkAreaEditorMock,
    };
  },
);

describe('EditorInspectorPanel', () => {
  const baseProps = {
    layers: [
      {
        id: 'l1',
        name: 'Layer 1',
        type: 'type',
        geometry: 'point',
        isVisible: true,
        isLocked: false,
      },
    ],
    workAreas: [],
    onWorkAreasChange: jest.fn(),
    onFocusWorkArea: jest.fn(),
    onMoveLayer: jest.fn(),
    onToggleLayerVisibility: jest.fn(),
    onToggleLayerLock: jest.fn(),
    layersOpen: true,
    onToggle: jest.fn(),
    onToggleLayers: jest.fn(),
  };

  it('renders expanded inspector and layer toggle', () => {
    render(<EditorInspectorPanel {...baseProps} isOpen />);

    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(
      screen.getByText('Editor Work Area Editor Mock'),
    ).toBeInTheDocument();
    expect(screen.getByText('Editor Layer List Mock')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse inspector panel' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse layers list' }),
    );

    expect(baseProps.onToggle).toHaveBeenCalled();
    expect(baseProps.onToggleLayers).toHaveBeenCalled();
  });

  it('renders collapsed inspector', () => {
    render(
      <EditorInspectorPanel {...baseProps} isOpen={false} layersOpen={false} />,
    );

    expect(
      screen.getByRole('button', { name: 'Expand inspector panel' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Inspector')).not.toBeInTheDocument();
  });
});
