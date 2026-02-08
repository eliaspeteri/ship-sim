import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditorShell from '../../../../src/features/editor/EditorShell';

const pushMock = jest.fn();
const compileOverlayDraftMock = jest.fn();
const compileOverlayServerMock = jest.fn();
const getWorkAreaTilesMock = jest.fn();
const clearOverlayCacheMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('../../../../src/features/editor/components/EditorViewport', () => {
  function EditorViewportMock() {
    return <div>Editor Viewport Mock</div>;
  }
  return { __esModule: true, default: EditorViewportMock };
});

jest.mock('../../../../src/features/editor/components/EditorBottomBar', () => {
  function EditorBottomBarMock({
    compileSummary,
    onPublish,
  }: {
    compileSummary?: string;
    onPublish?: () => void;
  }) {
    return (
      <div>
        <div data-testid="compile-summary">{compileSummary}</div>
        <button type="button" onClick={onPublish}>
          Publish Mock
        </button>
      </div>
    );
  }
  return { __esModule: true, default: EditorBottomBarMock };
});

jest.mock('../../../../src/features/editor/components/EditorToolsPanel', () => {
  function EditorToolsPanelMock({ activeTool }: { activeTool: string }) {
    return <div data-testid="active-tool">{activeTool}</div>;
  }
  return { __esModule: true, default: EditorToolsPanelMock };
});

jest.mock(
  '../../../../src/features/editor/components/EditorInspectorPanel',
  () => {
    function EditorInspectorPanelMock() {
      return <div>Editor Inspector Mock</div>;
    }
    return { __esModule: true, default: EditorInspectorPanelMock };
  },
);

jest.mock(
  '../../../../src/features/editor/services/overlayCompilation',
  () => ({
    compileOverlayDraft: (...args: any[]) => compileOverlayDraftMock(...args),
    compileOverlayServer: (...args: any[]) => compileOverlayServerMock(...args),
  }),
);

jest.mock('../../../../src/features/editor/services/overlayStreaming', () => ({
  getWorkAreaTiles: (...args: any[]) => getWorkAreaTilesMock(...args),
  clearOverlayCache: (...args: any[]) => clearOverlayCacheMock(...args),
}));

describe('EditorShell', () => {
  const pack = {
    id: 'pack-1',
    name: 'Pack One',
    description: 'desc',
    visibility: 'draft',
    updatedAt: '2026-01-01T00:00:00Z',
    workAreas: [
      {
        id: 'wa-1',
        name: 'Area',
        bounds: {
          type: 'bbox',
          minLat: 60,
          minLon: 24,
          maxLat: 60.2,
          maxLon: 24.2,
        },
        allowedZoom: [8, 14],
        sources: ['terrain'],
      },
    ],
  } as any;

  const layers = [
    {
      id: 'l1',
      name: 'Layer 1',
      type: 'type',
      geometry: 'point',
      isVisible: true,
      isLocked: false,
    },
    {
      id: 'l2',
      name: 'Layer 2',
      type: 'type',
      geometry: 'polygon',
      isVisible: true,
      isLocked: false,
    },
  ] as any;

  beforeEach(() => {
    pushMock.mockReset();
    compileOverlayDraftMock.mockReset();
    compileOverlayServerMock.mockReset();
    getWorkAreaTilesMock.mockReset();
    clearOverlayCacheMock.mockReset();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true });
    getWorkAreaTilesMock.mockReturnValue([{ z: 8, x: 1, y: 2 }]);
    compileOverlayDraftMock.mockResolvedValue({ artifacts: [{}, {}, {}] });
    compileOverlayServerMock.mockResolvedValue({ artifactCount: 5 });
  });

  it('runs draft compile and responds to tool hotkeys', async () => {
    render(<EditorShell pack={pack} layers={layers} />);

    await waitFor(() => {
      expect(compileOverlayDraftMock).toHaveBeenCalledWith({
        packId: 'pack-1',
        layerIds: ['l1', 'l2'],
        tiles: [{ z: 8, x: 1, y: 2 }],
      });
    });

    expect(screen.getByTestId('compile-summary')).toHaveTextContent(
      'Compile: 3 artifacts',
    );
    expect(screen.getByTestId('active-tool')).toHaveTextContent('select');

    fireEvent.keyDown(window, { key: '3' });
    expect(screen.getByTestId('active-tool')).toHaveTextContent('draw');
  });

  it('publishes compiled artifacts', async () => {
    render(<EditorShell pack={pack} layers={layers} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publish Mock' }));

    await waitFor(() => {
      expect(compileOverlayServerMock).toHaveBeenCalledWith({
        packId: 'pack-1',
        layerIds: ['l1', 'l2'],
        tiles: [{ z: 8, x: 1, y: 2 }],
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/editor/packs?published=pack-1');
    });

    expect(clearOverlayCacheMock).toHaveBeenCalled();
  });

  it('shows no-tiles publish state', async () => {
    getWorkAreaTilesMock.mockReturnValue([]);

    render(<EditorShell pack={{ ...pack, workAreas: [] }} layers={layers} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publish Mock' }));

    expect(screen.getByTestId('compile-summary')).toHaveTextContent(
      'Publish: no tiles',
    );
    expect(compileOverlayServerMock).not.toHaveBeenCalled();
  });
});
