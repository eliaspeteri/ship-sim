import React from 'react';
import {
  getVisibleOverlayTiles,
  loadOverlayChunks,
} from '../services/overlayStreaming';
import { EditorWorkArea } from '../types';
import EditorRenderer from './EditorRenderer';
import CameraHeadingIndicator from '../../../components/CameraHeadingIndicator';
import { latLonToXY, setGeoOrigin, xyToLatLon } from '../../../lib/geo';
import { isBBoxBounds } from '../types';

type EditorViewportProps = {
  title?: string;
  subtitle?: string;
  layerIds?: string[];
  workAreas?: EditorWorkArea[];
  packId: string;
  focusRequest?: {
    lat: number;
    lon: number;
    token: number;
    distanceMeters?: number;
  } | null;
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
  const [bootstrapFocus, setBootstrapFocus] = React.useState<{
    lat: number;
    lon: number;
    token: number;
    distanceMeters?: number;
  } | null>(null);
  const focusRef = React.useRef({ x: 0, y: 0 });
  const cameraStateRef = React.useRef({ y: 220, fov: 55, aspect: 1.6 });
  const geoOriginRef = React.useRef<{ lat: number; lon: number } | null>(null);

  React.useEffect(() => {
    geoOriginRef.current = null;
  }, [packId]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `editorCameraFocus:${packId}`;
    const saved = window.localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { lat: number; lon: number };
        if (
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lon) &&
          Math.abs(parsed.lat) <= 90 &&
          Math.abs(parsed.lon) <= 180
        ) {
          setBootstrapFocus({
            lat: parsed.lat,
            lon: parsed.lon,
            token: 1,
          });
          return;
        }
      } catch (error) {
        console.warn('Failed to parse saved camera focus', error);
      }
    }

    if (workAreas.length === 0) {
      setBootstrapFocus(null);
      return;
    }

    const area = workAreas[0];
    if (isBBoxBounds(area.bounds)) {
      const lat = (area.bounds.minLat + area.bounds.maxLat) / 2;
      const lon = (area.bounds.minLon + area.bounds.maxLon) / 2;
      const latMeters =
        Math.abs(area.bounds.maxLat - area.bounds.minLat) * 0.5 * 111_320;
      const lonMeters =
        Math.abs(area.bounds.maxLon - area.bounds.minLon) *
        0.5 *
        111_320 *
        Math.max(0.000001, Math.cos((lat * Math.PI) / 180));
      const radiusMeters = Math.max(50, Math.max(latMeters, lonMeters));
      setBootstrapFocus({
        lat,
        lon,
        token: 1,
        distanceMeters: radiusMeters * 2,
      });
      return;
    }

    if (area.bounds.coordinates.length === 0) {
      setBootstrapFocus(null);
      return;
    }

    const total = area.bounds.coordinates.reduce(
      (acc, [lat, lon]) => {
        acc.lat += lat;
        acc.lon += lon;
        return acc;
      },
      { lat: 0, lon: 0 },
    );
    const lat = total.lat / area.bounds.coordinates.length;
    const lon = total.lon / area.bounds.coordinates.length;
    setBootstrapFocus({
      lat,
      lon,
      token: 1,
    });
  }, [packId, workAreas]);

  React.useEffect(() => {
    if (geoOriginRef.current) return;

    let origin: { lat: number; lon: number } | null = null;

    if (workAreas.length === 0) {
      origin = focusRequest
        ? { lat: focusRequest.lat, lon: focusRequest.lon }
        : null;
    } else {
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLon = Infinity;
      let maxLon = -Infinity;

      workAreas.forEach(area => {
        if (isBBoxBounds(area.bounds)) {
          minLat = Math.min(minLat, area.bounds.minLat);
          maxLat = Math.max(maxLat, area.bounds.maxLat);
          minLon = Math.min(minLon, area.bounds.minLon);
          maxLon = Math.max(maxLon, area.bounds.maxLon);
          return;
        }

        area.bounds.coordinates.forEach(([lat, lon]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
        });
      });

      if (Number.isFinite(minLat) && Number.isFinite(minLon)) {
        origin = {
          lat: (minLat + maxLat) / 2,
          lon: (minLon + maxLon) / 2,
        };
      }
    }

    if (!origin) return;
    geoOriginRef.current = origin;
    setGeoOrigin(origin);
  }, [focusRequest, workAreas]);

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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          `editorCameraFocus:${packId}`,
          JSON.stringify({ lat, lon }),
        );
      }
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

    let throttled = false;
    const requestRun = () => {
      if (throttled) return;
      throttled = true;
      window.setTimeout(() => {
        throttled = false;
        run();
      }, 250);
    };

    run();
    window.addEventListener('pointerup', requestRun);
    window.addEventListener('wheel', requestRun, { passive: true });
    window.addEventListener('keydown', requestRun);
    window.addEventListener('keyup', requestRun);
    window.addEventListener('visibilitychange', requestRun);
    return () => {
      cancelled = true;
      window.removeEventListener('pointerup', requestRun);
      window.removeEventListener('wheel', requestRun);
      window.removeEventListener('keydown', requestRun);
      window.removeEventListener('keyup', requestRun);
      window.removeEventListener('visibilitychange', requestRun);
    };
  }, [isInsideWorkAreas, layerIds, packId, workAreas]);

  const effectiveFocusRequest = focusRequest ?? bootstrapFocus;

  const focusTarget = React.useMemo(() => {
    if (!effectiveFocusRequest) return null;
    const { x, y } = latLonToXY({
      lat: effectiveFocusRequest.lat,
      lon: effectiveFocusRequest.lon,
    });
    return {
      x,
      y,
      token: effectiveFocusRequest.token,
      distanceMeters: effectiveFocusRequest.distanceMeters,
    };
  }, [effectiveFocusRequest]);

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
