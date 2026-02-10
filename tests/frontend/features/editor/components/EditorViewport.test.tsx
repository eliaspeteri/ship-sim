import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import EditorViewport from '../../../../../src/features/editor/components/EditorViewport';

const mockEditorRenderer = jest.fn();
const mockGetVisibleOverlayTiles = jest.fn();
const mockLoadOverlayChunks = jest.fn();
const mockLatLonToXY = jest.fn();
const mockSetGeoOrigin = jest.fn();
const mockXyToLatLon = jest.fn();

jest.mock(
  '../../../../../src/features/editor/components/EditorRenderer',
  () => {
    const ReactLocal = require('react');
    return {
      __esModule: true,
      default: (props: any) => {
        mockEditorRenderer(props);
        ReactLocal.useEffect(() => {
          props.onHeadingChange?.(123.4);
        }, [props.onHeadingChange]);
        return <div data-testid="editor-renderer" />;
      },
    };
  },
);

jest.mock(
  '../../../../../src/features/editor/services/overlayStreaming',
  () => ({
    getVisibleOverlayTiles: (...args: unknown[]) =>
      mockGetVisibleOverlayTiles(...args),
    loadOverlayChunks: (...args: unknown[]) => mockLoadOverlayChunks(...args),
  }),
);

jest.mock('../../../../../src/lib/geo', () => ({
  latLonToXY: (...args: unknown[]) => mockLatLonToXY(...args),
  setGeoOrigin: (...args: unknown[]) => mockSetGeoOrigin(...args),
  xyToLatLon: (...args: unknown[]) => mockXyToLatLon(...args),
}));

jest.mock('../../../../../src/components/CameraHeadingIndicator', () => ({
  __esModule: true,
  default: ({ headingDeg }: { headingDeg: number }) => (
    <div data-testid="heading-indicator">{headingDeg.toFixed(1)}</div>
  ),
}));

describe('EditorViewport', () => {
  beforeEach(() => {
    localStorage.clear();
    mockEditorRenderer.mockReset();
    mockGetVisibleOverlayTiles.mockReset();
    mockLoadOverlayChunks.mockReset();
    mockLatLonToXY.mockReset();
    mockSetGeoOrigin.mockReset();
    mockXyToLatLon.mockReset();
    mockLatLonToXY.mockImplementation(({ lat, lon }) => ({
      x: lon * 1000,
      y: lat * 1000,
    }));
    mockXyToLatLon.mockReturnValue({ lat: 60, lon: 24 });
    mockGetVisibleOverlayTiles.mockReturnValue([]);
    mockLoadOverlayChunks.mockResolvedValue([]);
  });

  it('uses saved camera focus and shows no-layers status', async () => {
    localStorage.setItem(
      'editorCameraFocus:pack-1',
      JSON.stringify({ lat: 60.17, lon: 24.97 }),
    );

    render(<EditorViewport packId="pack-1" layerIds={[]} workAreas={[]} />);

    expect(screen.getByText('Overlay: no layers')).toBeInTheDocument();
    await waitFor(() => expect(mockEditorRenderer).toHaveBeenCalled());
    const lastProps = mockEditorRenderer.mock.calls.at(-1)?.[0];
    expect(lastProps.focusTarget).toEqual(
      expect.objectContaining({
        x: 24970,
        y: 60170,
        token: 1,
      }),
    );
    expect(mockSetGeoOrigin).not.toHaveBeenCalled();
    expect(screen.getByTestId('heading-indicator')).toHaveTextContent('123.4');
  });

  it('derives focus/origin from work area bounds and warns outside bounds', async () => {
    mockXyToLatLon.mockReturnValue({ lat: 90, lon: 180 });
    render(
      <EditorViewport
        packId="pack-2"
        layerIds={['depth']}
        workAreas={[
          {
            id: 'wa-1',
            name: 'Area',
            bounds: {
              type: 'bbox',
              minLat: 60,
              maxLat: 61,
              minLon: 24,
              maxLon: 25,
            },
            allowedZoom: [0, 16],
            sources: [],
          },
        ]}
      />,
    );

    await waitFor(() =>
      expect(mockSetGeoOrigin).toHaveBeenCalledWith({ lat: 60.5, lon: 24.5 }),
    );
    expect(await screen.findByText('Overlay tiles: 0')).toBeInTheDocument();
    expect(screen.getByText('Warning: outside work areas')).toBeInTheDocument();
  });

  it('requests overlay chunks and updates overlay status', async () => {
    mockGetVisibleOverlayTiles.mockReturnValue([{ z: 9, x: 300, y: 200 }]);
    mockLoadOverlayChunks.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

    render(
      <EditorViewport
        packId="pack-3"
        layerIds={['depth', 'coast']}
        workAreas={[]}
      />,
    );

    expect(await screen.findByText('Overlay tiles: 2')).toBeInTheDocument();
    expect(mockLoadOverlayChunks).toHaveBeenCalledWith([
      {
        key: { z: 9, x: 300, y: 200 },
        layers: ['depth', 'coast'],
        lod: 9,
        packId: 'pack-3',
      },
    ]);
    expect(localStorage.getItem('editorCameraFocus:pack-3')).toBeTruthy();
  });

  it('shows overlay error when chunk loading fails', async () => {
    mockGetVisibleOverlayTiles.mockReturnValue([{ z: 10, x: 1, y: 2 }]);
    mockLoadOverlayChunks.mockRejectedValue(new Error('boom'));

    render(
      <EditorViewport packId="pack-4" layerIds={['depth']} workAreas={[]} />,
    );

    expect(await screen.findByText('Overlay: error')).toBeInTheDocument();
  });

  it('prefers explicit focus request over bootstrap focus', async () => {
    localStorage.setItem(
      'editorCameraFocus:pack-5',
      JSON.stringify({ lat: 10, lon: 10 }),
    );

    render(
      <EditorViewport
        packId="pack-5"
        layerIds={[]}
        workAreas={[]}
        focusRequest={{ lat: 70, lon: 30, token: 99, distanceMeters: 800 }}
      />,
    );

    await waitFor(() => expect(mockEditorRenderer).toHaveBeenCalled());
    const lastProps = mockEditorRenderer.mock.calls.at(-1)?.[0];
    expect(lastProps.focusTarget).toEqual(
      expect.objectContaining({
        x: 30000,
        y: 70000,
        token: 99,
        distanceMeters: 800,
      }),
    );
  });
});
