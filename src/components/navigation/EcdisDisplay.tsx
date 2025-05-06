import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// --- Mock Data ---
const mockCoastline = [
  [24.93, 60.16],
  [24.95, 60.17],
  [24.97, 60.18],
  [24.99, 60.17],
  [25.01, 60.16],
  [24.99, 60.15],
  [24.97, 60.14],
  [24.95, 60.15],
  [24.93, 60.16],
];
const mockBuoys = [
  { lat: 60.165, lon: 24.96, type: 'starboard' },
  { lat: 60.175, lon: 24.98, type: 'port' },
];
const mockRoute = [
  { lat: 60.162, lon: 24.94 },
  { lat: 60.168, lon: 24.96 },
  { lat: 60.174, lon: 24.98 },
  { lat: 60.178, lon: 25.0 },
];
const mockShip = { lat: 60.168, lon: 24.965, heading: 87 };

// --- Helpers ---
function latLonToXY(lat, lon, center, scale) {
  // Simple equirectangular projection for small area
  return [(lon - center.lon) * scale, -(lat - center.lat) * scale];
}

export interface EcdisDisplayProps {
  shipPosition?: { latitude: number; longitude: number; heading?: number };
  route?: Array<{ latitude: number; longitude: number }>;
  chartData?: {
    coastline: Array<[number, number]>;
    buoys: Array<{ lat: number; lon: number; type: string }>;
  };
}

export const EcdisDisplay: React.FC<EcdisDisplayProps> = ({
  shipPosition,
  route,
  chartData,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationRef = useRef<number | null>(null);

  // --- Pan & Zoom State ---
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragState = useRef<{
    dragging: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);

  // --- Ship Animation State ---
  const [animatedShip, setAnimatedShip] = useState<{
    lat: number;
    lon: number;
    heading: number;
  } | null>(null);
  const animationActive = useRef(true);

  // --- Cursor Lat/Lon State ---
  const [cursorLatLon, setCursorLatLon] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  // --- Layer Visibility State ---
  const [showCoastline, setShowCoastline] = useState(true);
  const [showBuoys, setShowBuoys] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // Chart constants
  const size = 500;
  const center = { lat: 60.17, lon: 24.97 };
  const coastline = (chartData?.coastline ?? mockCoastline).map(
    ([lon, lat]) => [lat, lon],
  );
  const buoys = chartData?.buoys ?? mockBuoys;
  const routePoints = (route ?? mockRoute).map(wp => [wp.lat, wp.lon]);
  // Use animated ship if available, else prop or mock
  const ship =
    animatedShip ||
    (shipPosition
      ? {
          lat: shipPosition.latitude,
          lon: shipPosition.longitude,
          heading: shipPosition.heading ?? 0,
        }
      : mockShip);
  const scale = 12000; // meters per degree (zoom)

  // --- Animate Ship Along Route ---
  useEffect(() => {
    if (!routePoints.length) return;
    let idx = 0;
    let t = 0;
    animationActive.current = true;
    function step() {
      if (!animationActive.current) return;
      const [lat1, lon1] = routePoints[idx];
      const [lat2, lon2] = routePoints[(idx + 1) % routePoints.length];
      t += 0.002; // speed
      if (t > 1) {
        t = 0;
        idx = (idx + 1) % routePoints.length;
      }
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;
      const heading = (Math.atan2(lon2 - lon1, lat2 - lat1) * 180) / Math.PI;
      setAnimatedShip({ lat, lon, heading });
      setTimeout(step, 100);
    }
    step();
    return () => {
      animationActive.current = false;
    };
  }, [route]);

  // --- Mouse Move Handler for Lat/Lon Overlay ---
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const canvas = renderer.domElement;
    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      // Apply pan and zoom
      const cam = cameraRef.current;
      if (!cam) return;
      const zoom = cam.zoom;
      const panX = cam.position.x;
      const panY = cam.position.y;
      // Convert screen to world coordinates
      const worldX = x / zoom + panX;
      const worldY = y / zoom + panY;
      // Inverse projection
      const lon = worldX / scale + center.lon;
      const lat = center.lat - worldY / scale;
      setCursorLatLon({ lat, lon });
    }
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', () => setCursorLatLon(null));
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', () => setCursorLatLon(null));
    };
  }, [size, scale, center]);

  // --- Setup Three.js scene ---
  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x22304a);
    renderer.setSize(size, size);
    rendererRef.current = renderer;
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Camera: Orthographic for 2D
    const viewSize = size;
    const cam = new THREE.OrthographicCamera(
      -viewSize / 2,
      viewSize / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000,
    );
    cam.position.set(0, 0, 100);
    cam.lookAt(0, 0, 0);
    cam.zoom = zoomRef.current;
    cam.updateProjectionMatrix();
    cam.position.x = panRef.current.x;
    cam.position.y = panRef.current.y;
    cameraRef.current = cam;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // --- Coastline ---
    if (showCoastline) {
      const coastShape = new THREE.Shape();
      coastline.forEach(([lat, lon], i) => {
        const [x, y] = latLonToXY(lat, lon, center, scale);
        if (i === 0) coastShape.moveTo(x, y);
        else coastShape.lineTo(x, y);
      });
      const coastGeom = new THREE.ShapeGeometry(coastShape);
      const coastMat = new THREE.MeshBasicMaterial({ color: 0xb7c9a7 });
      const coastMesh = new THREE.Mesh(coastGeom, coastMat);
      scene.add(coastMesh);
      // Coastline outline
      const coastLineMat = new THREE.LineBasicMaterial({
        color: 0x7a8c6e,
        linewidth: 2,
      });
      const coastLinePoints = coastline.map(([lat, lon]) => {
        const [x, y] = latLonToXY(lat, lon, center, scale);
        return new THREE.Vector3(x, y, 1);
      });
      const coastLineGeom = new THREE.BufferGeometry().setFromPoints(
        coastLinePoints,
      );
      const coastLine = new THREE.Line(coastLineGeom, coastLineMat);
      scene.add(coastLine);
    }

    // --- Buoys ---
    if (showBuoys) {
      buoys.forEach(b => {
        const [x, y] = latLonToXY(b.lat, b.lon, center, scale);
        const buoyGeom = new THREE.CircleGeometry(7, 24);
        const buoyMat = new THREE.MeshBasicMaterial({
          color: b.type === 'starboard' ? 0x2dd4bf : 0xf87171,
        });
        const buoyMesh = new THREE.Mesh(buoyGeom, buoyMat);
        buoyMesh.position.set(x, y, 2);
        scene.add(buoyMesh);
        // Outline
        const outlineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const outlineGeom = new THREE.CircleGeometry(7, 24);
        const outlineVertices = outlineGeom.getAttribute('position');
        const outlinePoints: THREE.Vector3[] = [];
        for (let i = 0; i < outlineVertices.count; i++) {
          outlinePoints.push(
            new THREE.Vector3(
              outlineVertices.getX(i),
              outlineVertices.getY(i),
              outlineVertices.getZ(i),
            ),
          );
        }
        outlinePoints.push(outlinePoints[0]); // Close the loop
        const outlineLineGeom = new THREE.BufferGeometry().setFromPoints(
          outlinePoints,
        );
        const outline = new THREE.Line(outlineLineGeom, outlineMat);
        outline.position.set(x, y, 2.1);
        scene.add(outline);
      });
    }

    // --- Route ---
    if (showRoute) {
      const routeLineMat = new THREE.LineDashedMaterial({
        color: 0xfbbf24,
        dashSize: 8,
        gapSize: 6,
      });
      const routeLinePoints = routePoints.map(([lat, lon]) => {
        const [x, y] = latLonToXY(lat, lon, center, scale);
        return new THREE.Vector3(x, y, 3);
      });
      const routeLineGeom = new THREE.BufferGeometry().setFromPoints(
        routeLinePoints,
      );
      const routeLine = new THREE.Line(routeLineGeom, routeLineMat);
      routeLine.computeLineDistances();
      scene.add(routeLine);
      // Waypoints
      routePoints.forEach(([lat, lon]) => {
        const [x, y] = latLonToXY(lat, lon, center, scale);
        const wpGeom = new THREE.CircleGeometry(5, 16);
        const wpMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const wpMesh = new THREE.Mesh(wpGeom, wpMat);
        wpMesh.position.set(x, y, 3.1);
        scene.add(wpMesh);
        // Outline
        const wpOutlineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wpOutlineGeom = new THREE.CircleGeometry(5, 16);
        const wpOutlineVertices = wpOutlineGeom.getAttribute('position');
        const wpOutlinePoints: THREE.Vector3[] = [];
        for (let i = 0; i < wpOutlineVertices.count; i++) {
          wpOutlinePoints.push(
            new THREE.Vector3(
              wpOutlineVertices.getX(i),
              wpOutlineVertices.getY(i),
              wpOutlineVertices.getZ(i),
            ),
          );
        }
        wpOutlinePoints.push(wpOutlinePoints[0]); // Close the loop
        const wpOutlineLineGeom = new THREE.BufferGeometry().setFromPoints(
          wpOutlinePoints,
        );
        const wpOutline = new THREE.Line(wpOutlineLineGeom, wpOutlineMat);
        wpOutline.position.set(x, y, 3.2);
        scene.add(wpOutline);
      });
    }

    // --- Own Ship ---
    const [sx, sy] = latLonToXY(ship.lat, ship.lon, center, scale);
    const shipShape = new THREE.Shape();
    shipShape.moveTo(0, -14);
    shipShape.lineTo(7, 10);
    shipShape.lineTo(-7, 10);
    shipShape.lineTo(0, -14);
    const shipGeom = new THREE.ShapeGeometry(shipShape);
    const shipMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const shipMesh = new THREE.Mesh(shipGeom, shipMat);
    shipMesh.position.set(sx, sy, 4);
    shipMesh.rotation.z = -THREE.MathUtils.degToRad(ship.heading ?? 0);
    scene.add(shipMesh);
    // Ship center
    const shipCenterGeom = new THREE.CircleGeometry(4, 16);
    const shipCenterMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shipCenter = new THREE.Mesh(shipCenterGeom, shipCenterMat);
    shipCenter.position.set(sx, sy, 4.1);
    scene.add(shipCenter);

    // --- Pan & Zoom Handlers ---
    const canvas = renderer.domElement;
    function onPointerDown(e: PointerEvent) {
      dragState.current = {
        dragging: true,
        lastX: e.clientX,
        lastY: e.clientY,
      };
    }
    function onPointerMove(e: PointerEvent) {
      if (dragState.current?.dragging) {
        const dx = e.clientX - dragState.current.lastX;
        const dy = e.clientY - dragState.current.lastY;
        panRef.current.x -= dx / cam.zoom; // Invert pan direction
        panRef.current.y += dy / cam.zoom; // Invert pan direction
        cam.position.x = panRef.current.x;
        cam.position.y = panRef.current.y;
        cam.updateProjectionMatrix();
        dragState.current.lastX = e.clientX;
        dragState.current.lastY = e.clientY;
      }
    }
    function onPointerUp() {
      if (dragState.current) dragState.current.dragging = false;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const zoomFactor = 1.1;
      if (e.deltaY < 0) zoomRef.current *= zoomFactor;
      else zoomRef.current /= zoomFactor;
      zoomRef.current = Math.max(0.5, Math.min(zoomRef.current, 10));
      cam.zoom = zoomRef.current;
      cam.updateProjectionMatrix();
    }
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // --- Render loop ---
    function animate() {
      renderer.render(scene, cam);
      animationRef.current = requestAnimationFrame(animate);
    }
    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationRef.current!);
      renderer.dispose();
      scene.clear();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [shipPosition, route, chartData, showCoastline, showBuoys, showRoute]);

  // --- Overlay Info (static for MVP) ---
  return (
    <div
      style={{
        background: '#1a2230',
        borderRadius: 12,
        boxShadow: '0 2px 12px #0008',
        padding: 16,
        width: size + 32,
        color: '#e0f2f1',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>
          ECDIS (three.js MVP)
        </span>
        <span style={{ fontSize: 14 }}>Scale: 1:{scale}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={showCoastline}
            onChange={e => setShowCoastline(e.target.checked)}
          />{' '}
          Coastline
        </label>
        <label>
          <input
            type="checkbox"
            checked={showBuoys}
            onChange={e => setShowBuoys(e.target.checked)}
          />{' '}
          Buoys
        </label>
        <label>
          <input
            type="checkbox"
            checked={showRoute}
            onChange={e => setShowRoute(e.target.checked)}
          />{' '}
          Route
        </label>
      </div>
      <div
        ref={mountRef}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#22304a',
          position: 'relative',
        }}
      />
      {/* Lat/Lon Overlay */}
      {cursorLatLon && (
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: size + 24,
            background: '#23272e',
            color: '#e0f2f1',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 15,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          Lat: {cursorLatLon.lat.toFixed(5)}, Lon: {cursorLatLon.lon.toFixed(5)}
        </div>
      )}
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Ship: {ship.lat.toFixed(5)}, {ship.lon.toFixed(5)}
        </span>
        <span>Heading: {ship.heading?.toFixed(1)}°</span>
      </div>
    </div>
  );
};
