import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { EcdisSidebar } from './EcdisSidebar';
import { mockBuoys, mockCoastline, mockRoute } from './mockData';
import { drawEcdisScene } from './scene';
import type { EcdisDisplayProps } from './types';

export const EcdisDisplay: React.FC<EcdisDisplayProps> = ({
  shipPosition,
  heading,
  route,
  chartData,
  aisTargets,
}) => {
  const MOCK_OWN_SHIP_AT_VIEW_CENTER = true;
  const OWN_SHIP_VISUAL_SCALE = 2.5;

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  const [viewport, setViewport] = useState({ width: 900, height: 640 });
  const [cursorLatLon, setCursorLatLon] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const editableRoute = route ?? mockRoute;
  const center = useMemo(() => ({ latitude: 60.17, longitude: 24.97 }), []);
  const scale = 12000;

  const coastline = useMemo(
    () =>
      (chartData?.coastline ?? mockCoastline).map(([longitude, latitude]) => [
        latitude,
        longitude,
      ]),
    [chartData],
  );

  const buoys = chartData?.buoys ?? mockBuoys;

  const ship = useMemo(
    () => ({
      latitude: MOCK_OWN_SHIP_AT_VIEW_CENTER
        ? center.latitude
        : (shipPosition?.lat ?? center.latitude),
      longitude: MOCK_OWN_SHIP_AT_VIEW_CENTER
        ? center.longitude
        : (shipPosition?.lon ?? center.longitude),
      heading: heading ?? 0,
    }),
    [
      MOCK_OWN_SHIP_AT_VIEW_CENTER,
      shipPosition,
      heading,
      center.latitude,
      center.longitude,
    ],
  );

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panDragRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!mountRef.current) return;
    const mountEl = mountRef.current;

    while (mountEl.firstChild) {
      mountEl.removeChild(mountEl.firstChild);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x04114e, 1);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    rendererRef.current = renderer;
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const ro = new window.ResizeObserver(entries => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      const width = Math.max(360, Math.floor(box.width));
      const height = Math.max(260, Math.floor(box.height));
      setViewport({ width, height });
      renderer.setSize(width, height, true);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.zoom = zoomRef.current;
      camera.position.x = panRef.current.x;
      camera.position.y = panRef.current.y;
      camera.updateProjectionMatrix();
    });

    ro.observe(mountRef.current);

    return () => {
      ro.disconnect();
      renderer.dispose();
      scene.clear();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  const screenToLatLon = useCallback(
    (clientX: number, clientY: number) => {
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (!camera || !renderer) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      const localX = clientX - rect.left - rect.width / 2;
      const localY = clientY - rect.top - rect.height / 2;
      const worldX = localX / camera.zoom + camera.position.x;
      const worldY = localY / camera.zoom + camera.position.y;
      return {
        latitude: center.latitude - worldY / scale,
        longitude: worldX / scale + center.longitude,
      };
    },
    [center.latitude, center.longitude, scale],
  );

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;

    const canvas = renderer.domElement;

    function onPointerDown(e: PointerEvent) {
      panDragRef.current = { active: true, x: e.clientX, y: e.clientY };
    }

    function onPointerMove(e: PointerEvent) {
      const pt = screenToLatLon(e.clientX, e.clientY);
      if (pt) setCursorLatLon(pt);

      if (!camera) return;

      if (!panDragRef.current.active) return;

      const dx = e.clientX - panDragRef.current.x;
      const dy = e.clientY - panDragRef.current.y;
      panRef.current.x -= dx / camera.zoom;
      panRef.current.y += dy / camera.zoom;
      camera.position.x = panRef.current.x;
      camera.position.y = panRef.current.y;
      camera.updateProjectionMatrix();
      panDragRef.current = { active: true, x: e.clientX, y: e.clientY };
    }

    function onPointerUp() {
      panDragRef.current.active = false;
    }

    function onPointerLeave() {
      setCursorLatLon(null);
      panDragRef.current.active = false;
    }

    function onWheel(e: WheelEvent) {
      if (!camera) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomRef.current = Math.max(0.5, Math.min(10, zoomRef.current * factor));
      camera.zoom = zoomRef.current;
      camera.updateProjectionMatrix();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [center, scale, screenToLatLon]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    drawEcdisScene({
      scene,
      renderer,
      camera,
      center,
      scale,
      coastline,
      buoys,
      route: editableRoute,
      ship,
      ownShipVisualScale: OWN_SHIP_VISUAL_SCALE,
      aisTargets,
    });
  }, [
    aisTargets,
    buoys,
    center,
    coastline,
    editableRoute,
    scale,
    ship,
    viewport.height,
    viewport.width,
  ]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: 'calc(100vh - 240px)',
        minHeight: 500,
        background: '#04114e',
        border: '2px solid #1739c9',
        color: '#b9dbff',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          borderRight: '2px solid #1739c9',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div
          style={{
            minHeight: 34,
            borderTop: '1px solid #1a399f',
            background: '#010a30',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            fontSize: 12,
          }}
        >
          Cursor:{' '}
          {cursorLatLon
            ? `${cursorLatLon.latitude.toFixed(5)}, ${cursorLatLon.longitude.toFixed(5)}`
            : '--'}
        </div>
      </div>

      <EcdisSidebar ship={ship} />
    </div>
  );
};
