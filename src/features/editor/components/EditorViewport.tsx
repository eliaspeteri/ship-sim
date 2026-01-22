import React from 'react';
import {
  getVisibleOverlayTiles,
  loadOverlayChunks,
} from '../services/overlayStreaming';
import { EditorWorkArea } from '../types';
import EditorRenderer from './EditorRenderer';
import CameraHeadingIndicator from '../../../components/CameraHeadingIndicator';
import { latLonToXY, xyToLatLon } from '../../../lib/geo';

type EditorViewportProps = {
  title?: string;
  subtitle?: string;
  layerIds?: string[];
  workAreas?: EditorWorkArea[];
  packId: string;
  focusRequest?: { lat: number; lon: number; token: number } | null;
};

const EditorViewport: React.FC<EditorViewportProps> = ({
  title = '',
  subtitle = '',
  layerIds = [],
  workAreas = [],
  packId,
  focusRequest = null,
}) => {
  const [overlayStatus, setOverlayStatus] = React.useState('Overlay: idle');
  const [boundsStatus, setBoundsStatus] = React.useState<string | null>(null);
  const [cameraHeadingDeg, setCameraHeadingDeg] = React.useState(0);
  const focusRef = React.useRef({ x: 0, y: 0 });
  const cameraStateRef = React.useRef({ y: 220, fov: 55, aspect: 1.6 });

  const zoomFromCameraY = (camY: number) => {
    if (camY < 150) return 13;
    if (camY < 300) return 12;
    if (camY < 700) return 11;
    if (camY < 1500) return 10;
    if (camY < 3500) return 9;
    return 8;
  };

  const isInsideWorkAreas = React.useCallback(
    (lat: number, lon: number) => {
      if (workAreas.length === 0) return true;
      const pointInPolygon = (
        point: [number, number],
        polygon: Array<[number, number]>,
      ) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [latI, lonI] = polygon[i];
          const [latJ, lonJ] = polygon[j];
          const intersects =
            lonI > point[1] !== lonJ > point[1] &&
            point[0] <
              ((latJ - latI) * (point[1] - lonI)) / (lonJ - lonI + 0.000001) +
                latI;
          if (intersects) inside = !inside;
        }
        return inside;
      };

      return workAreas.some(area => {
        if (area.bounds.type === 'bbox') {
          return (
            lat >= area.bounds.minLat &&
            lat <= area.bounds.maxLat &&
            lon >= area.bounds.minLon &&
            lon <= area.bounds.maxLon
          );
        }
        return pointInPolygon([lat, lon], area.bounds.coordinates);
      });
    },
    [workAreas],
  );

  React.useEffect(() => {
    let cancelled = false;
    const activeLayers = layerIds;
    if (activeLayers.length === 0) {
      setOverlayStatus('Overlay: no layers');
      return undefined;
    }

    const run = () => {
      const { lat, lon } = xyToLatLon({
        x: focusRef.current.x,
        y: focusRef.current.y,
      });
      const zoom = zoomFromCameraY(cameraStateRef.current.y);
      const tiles = getVisibleOverlayTiles({
        centerLat: lat,
        centerLon: lon,
        zoom,
        workAreas,
        cameraHeight: cameraStateRef.current.y,
        cameraFov: cameraStateRef.current.fov,
        cameraAspect: cameraStateRef.current.aspect,
      });
      const requests = tiles.map(tile => ({
        packId,
        key: tile,
        layers: activeLayers,
        lod: tile.z,
      }));
      if (requests.length === 0) {
        setOverlayStatus('Overlay tiles: 0');
        setBoundsStatus(
          isInsideWorkAreas(lat, lon) ? null : 'Warning: outside work areas',
        );
        return;
      }
      void loadOverlayChunks(requests)
        .then(chunks => {
          if (!cancelled) {
            setOverlayStatus(`Overlay tiles: ${chunks.length}`);
            setBoundsStatus(
              isInsideWorkAreas(lat, lon)
                ? null
                : 'Warning: outside work areas',
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOverlayStatus('Overlay: error');
          }
        });
    };

    run();
    const interval = window.setInterval(run, 400);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isInsideWorkAreas, layerIds, packId, workAreas]);

  const focusTarget = React.useMemo(() => {
    if (!focusRequest) return null;
    const { x, y } = latLonToXY({
      lat: focusRequest.lat,
      lon: focusRequest.lon,
    });
    return { x, y, token: focusRequest.token };
  }, [focusRequest]);

  return (
    <section className="absolute inset-0 overflow-hidden bg-editor-viewport">
      <EditorRenderer
        focusRef={focusRef}
        cameraStateRef={cameraStateRef}
        workAreas={workAreas}
        focusTarget={focusTarget}
        onHeadingChange={setCameraHeadingDeg}
      />
      {title || subtitle ? (
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          {title ? (
            <div className="mb-1.5 text-[20px] font-semibold">{title}</div>
          ) : null}
          {subtitle ? (
            <div className="text-editor-muted">{subtitle}</div>
          ) : null}
        </div>
      ) : null}
      <div className="absolute left-3 top-3 rounded-full border border-editor-quiet-border bg-editor-quiet-bg px-3 py-1 text-[11px] text-editor-muted">
        {overlayStatus}
      </div>
      {boundsStatus ? (
        <div className="absolute left-3 top-12 rounded-full border border-editor-quiet-border bg-editor-quiet-bg px-3 py-1 text-[11px] text-editor-muted">
          {boundsStatus}
        </div>
      ) : null}
      <CameraHeadingIndicator headingDeg={cameraHeadingDeg} />
    </section>
  );
};

export default EditorViewport;
