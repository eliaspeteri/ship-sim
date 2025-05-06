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
  { latitude: 60.165, longitude: 24.96, type: 'starboard' },
  { latitude: 60.175, longitude: 24.98, type: 'port' },
];
const mockRoute = [
  { latitude: 60.162, longitude: 24.94 },
  { latitude: 60.168, longitude: 24.96 },
  { latitude: 60.174, longitude: 24.98 },
  { latitude: 60.178, longitude: 25.0 },
];
const mockShip = { latitude: 60.168, longitude: 24.965, heading: 87 };

// --- Mock AIS Targets ---
const mockAisTargets = [
  {
    mmsi: '123456789',
    name: 'Vessel A',
    lat: 60.166,
    lon: 24.98,
    heading: 45,
    speed: 12,
  },
  {
    mmsi: '987654321',
    name: 'Vessel B',
    lat: 60.175,
    lon: 24.95,
    heading: 270,
    speed: 9,
  },
  {
    mmsi: '555555555',
    name: 'Vessel C',
    lat: 60.172,
    lon: 24.99,
    heading: 120,
    speed: 7,
  },
];

// --- Helpers ---
function latLonToXY(latitude, longitude, center, scale) {
  // Simple equirectangular projection for small area
  return [
    (longitude - center.longitude) * scale,
    -(latitude - center.latitude) * scale,
  ];
}

export interface EcdisDisplayProps {
  shipPosition?: { latitude: number; longitude: number; heading?: number };
  route?: Array<{ latitude: number; longitude: number }>;
  chartData?: {
    coastline: Array<[number, number]>;
    buoys: Array<{ latitude: number; longitude: number; type: string }>;
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
    latitude: number;
    longitude: number;
    heading: number;
  } | null>(null);
  const animationActive = useRef(true);

  // --- Cursor latitude/longitude State ---
  const [cursorlatitudeLon, setCursorlatitudeLon] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // --- Layer Visibility State ---
  const [showCoastline, setShowCoastline] = useState(true);
  const [showBuoys, setShowBuoys] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // --- Editable Route State ---
  const [editableRoute, setEditableRoute] = useState(route ?? mockRoute);
  // --- Selected Waypoint State ---
  const [selectedWp, setSelectedWp] = useState<number | null>(null);

  // --- AIS State ---
  const [aisTargets, setAisTargets] = useState(mockAisTargets);

  // Chart constants
  const size = 500;
  const center = { latitude: 60.17, longitude: 24.97 };
  const coastline = (chartData?.coastline ?? mockCoastline).map(
    ([longitude, latitude]) => [latitude, longitude],
  );
  const buoys = chartData?.buoys ?? mockBuoys;
  // Use editable route for animation and rendering
  const routePoints = editableRoute.map(wp => [wp.latitude, wp.longitude]);
  // Use animated ship if available, else prop or mock
  const ship =
    animatedShip ||
    (shipPosition
      ? {
          latitude: shipPosition.latitude,
          longitude: shipPosition.longitude,
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
      const [latitude1, lon1] = routePoints[idx];
      const [latitude2, lon2] = routePoints[(idx + 1) % routePoints.length];
      t += 0.002; // speed
      if (t > 1) {
        t = 0;
        idx = (idx + 1) % routePoints.length;
      }
      const latitude = latitude1 + (latitude2 - latitude1) * t;
      const longitude = lon1 + (lon2 - lon1) * t;
      const heading =
        (Math.atan2(lon2 - lon1, latitude2 - latitude1) * 180) / Math.PI;
      setAnimatedShip({ latitude, longitude, heading });
      setTimeout(step, 100);
    }
    step();
    return () => {
      animationActive.current = false;
    };
  }, [route]);

  // --- Animate AIS Targets (mock movement) ---
  useEffect(() => {
    let running = true;
    function moveTargets() {
      setAisTargets(targets =>
        targets.map(t => {
          // Move each target in heading direction
          const dist = t.speed * 0.00002; // mock speed factor
          const rad = (t.heading * Math.PI) / 180;
          return {
            ...t,
            lat: t.lat + Math.cos(rad) * dist,
            lon: t.lon + Math.sin(rad) * dist,
          };
        }),
      );
      if (running) setTimeout(moveTargets, 200);
    }
    moveTargets();
    return () => {
      running = false;
    };
  }, []);

  // --- Mouse Move Handler for latitude/longitude Overlay ---
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
      const longitude = worldX / scale + center.longitude;
      const latitude = center.latitude - worldY / scale;
      setCursorlatitudeLon({ latitude, longitude });
    }
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', () => setCursorlatitudeLon(null));
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', () =>
        setCursorlatitudeLon(null),
      );
    };
  }, [size, scale, center]);

  // --- Add/Move/Delete Waypoint Handlers ---
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const canvas = renderer.domElement;
    let draggingWp: number | null = null;
    function screenTolatitudeLon(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const cam = cameraRef.current;
      if (!cam) return null;
      const zoom = cam.zoom;
      const panX = cam.position.x;
      const panY = cam.position.y;
      const worldX = x / zoom + panX;
      const worldY = y / zoom + panY;
      const longitude = worldX / scale + center.longitude;
      const latitude = center.latitude - worldY / scale;
      return { latitude, longitude };
    }
    function onPointerDown(e: PointerEvent) {
      // Check if near a waypoint
      const pt = screenTolatitudeLon(e);
      if (!pt) return;
      for (let i = 0; i < editableRoute.length; i++) {
        const wp = editableRoute[i];
        const dx = (wp.longitude - pt.longitude) * scale;
        const dy = (wp.latitude - pt.latitude) * scale;
        if (Math.sqrt(dx * dx + dy * dy) < 12) {
          draggingWp = i;
          setSelectedWp(i);
          return;
        }
      }
      // Otherwise, add new waypoint
      setEditableRoute([...editableRoute, pt]);
      setSelectedWp(editableRoute.length);
    }
    function onPointerMove(e: PointerEvent) {
      if (draggingWp !== null) {
        const pt = screenTolatitudeLon(e);
        if (!pt) return;
        setEditableRoute(route =>
          route.map((wp, i) => (i === draggingWp ? pt : wp)),
        );
      }
    }
    function onPointerUp() {
      draggingWp = null;
    }
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [editableRoute, size, scale, center]);

  // --- Delete Waypoint Handler ---
  function deleteSelectedWaypoint() {
    if (selectedWp !== null) {
      setEditableRoute(route => route.filter((_, i) => i !== selectedWp));
      setSelectedWp(null);
    }
  }

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
      coastline.forEach(([latitude, longitude], i) => {
        const [x, y] = latLonToXY(latitude, longitude, center, scale);
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
      const coastLinePoints = coastline.map(([latitude, longitude]) => {
        const [x, y] = latLonToXY(latitude, longitude, center, scale);
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
        const [x, y] = latLonToXY(b.latitude, b.longitude, center, scale);
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
      const routeLinePoints = routePoints.map(([latitude, longitude]) => {
        const [x, y] = latLonToXY(latitude, longitude, center, scale);
        return new THREE.Vector3(x, y, 3);
      });
      const routeLineGeom = new THREE.BufferGeometry().setFromPoints(
        routeLinePoints,
      );
      const routeLine = new THREE.Line(routeLineGeom, routeLineMat);
      routeLine.computeLineDistances();
      scene.add(routeLine);
      // Waypoints
      editableRoute.forEach((wp, i) => {
        const [x, y] = latLonToXY(wp.latitude, wp.longitude, center, scale);
        const isSelected = selectedWp === i;
        const wpGeom = new THREE.CircleGeometry(isSelected ? 8 : 5, 16);
        const wpMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xf87171 : 0xfbbf24,
        });
        const wpMesh = new THREE.Mesh(wpGeom, wpMat);
        wpMesh.position.set(x, y, 3.1);
        scene.add(wpMesh);
        // Outline
        const wpOutlineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wpOutlineGeom = new THREE.CircleGeometry(isSelected ? 8 : 5, 16);
        const wpOutlineVertices = wpOutlineGeom.getAttribute('position');
        const wpOutlinePoints: THREE.Vector3[] = [];
        for (let j = 0; j < wpOutlineVertices.count; j++) {
          wpOutlinePoints.push(
            new THREE.Vector3(
              wpOutlineVertices.getX(j),
              wpOutlineVertices.getY(j),
              wpOutlineVertices.getZ(j),
            ),
          );
        }
        wpOutlinePoints.push(wpOutlinePoints[0]);
        const wpOutlineLineGeom = new THREE.BufferGeometry().setFromPoints(
          wpOutlinePoints,
        );
        const wpOutline = new THREE.Line(wpOutlineLineGeom, wpOutlineMat);
        wpOutline.position.set(x, y, 3.2);
        scene.add(wpOutline);
      });
    }

    // --- Own Ship ---
    const [sx, sy] = latLonToXY(ship.latitude, ship.longitude, center, scale);
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

    // --- AIS Targets ---
    aisTargets.forEach(t => {
      const [x, y] = latLonToXY(t.lat, t.lon, center, scale);
      // Target icon (triangle)
      const tgtShape = new THREE.Shape();
      tgtShape.moveTo(0, -10);
      tgtShape.lineTo(6, 8);
      tgtShape.lineTo(-6, 8);
      tgtShape.lineTo(0, -10);
      const tgtGeom = new THREE.ShapeGeometry(tgtShape);
      const tgtMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const tgtMesh = new THREE.Mesh(tgtGeom, tgtMat);
      tgtMesh.position.set(x, y, 5);
      tgtMesh.rotation.z = -THREE.MathUtils.degToRad(t.heading ?? 0);
      scene.add(tgtMesh);
      // Label (simple, above target)
      const labelDiv = document.createElement('div');
      labelDiv.style.position = 'absolute';
      labelDiv.style.left = `${x + size / 2 - 20}px`;
      labelDiv.style.top = `${y + size / 2 - 24}px`;
      labelDiv.style.color = '#34d399';
      labelDiv.style.fontSize = '13px';
      labelDiv.style.fontFamily = 'monospace';
      labelDiv.style.pointerEvents = 'none';
      labelDiv.style.zIndex = '20';
      labelDiv.textContent = t.name || t.mmsi;
      if (mountRef.current) mountRef.current.appendChild(labelDiv);
      // Remove label on cleanup
      setTimeout(() => labelDiv.remove(), 0);
    });

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
        {selectedWp !== null && (
          <button
            onClick={deleteSelectedWaypoint}
            style={{ color: '#f87171', marginLeft: 16 }}
          >
            Delete Waypoint #{selectedWp + 1}
          </button>
        )}
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
      {/* latitude/longitude Overlay */}
      {cursorlatitudeLon && (
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
          latitude: {cursorlatitudeLon.latitude.toFixed(5)}, longitude:{' '}
          {cursorlatitudeLon.longitude.toFixed(5)}
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
          Ship: {ship.latitude.toFixed(5)}, {ship.longitude.toFixed(5)}
        </span>
        <span>Heading: {ship.heading?.toFixed(1)}°</span>
      </div>
    </div>
  );
};
