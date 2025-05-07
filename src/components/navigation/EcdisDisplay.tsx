import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TopNavigationBar } from '../common/TopNavigationBar';
import { RightStatusPanel } from '../common/RightStatusPanel';
import { RouteInfoPanel } from '../common/RouteInfoPanel';
import { EBLControl, EBLState } from './EBLControl';
import { VRMControl, VRMState } from './VRMControl';
import { StatusPanelSchema } from '../common/StatusPanelTypes';

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
function latLonToXY(
  latitude: number,
  longitude: number,
  center: { latitude: number; longitude: number },
  scale: number,
) {
  // Simple equirectangular projection for small area
  return [
    (longitude - center.longitude) * scale,
    -(latitude - center.latitude) * scale,
  ];
}

/**
 * Calculate the great-circle distance (meters) and initial bearing (degrees) between two lat/lon points.
 * Uses the haversine formula for distance and forward azimuth for bearing.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns { distance: number, bearing: number }
 */
function calculateDistanceAndBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): { distance: number; bearing: number } {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return { distance, bearing };
}

/**
 * Converts screen coordinates to latitude/longitude
 * Accounts for chart position, pan, and zoom
 *
 * @param x Client X coordinate (from mouse event)
 * @param y Client Y coordinate (from mouse event)
 * @param canvas Canvas element reference
 * @param camera Camera reference for current view state
 * @param center Center coordinates of the map
 * @param scale Scale factor for the map
 * @returns Latitude/longitude coordinates or null if conversion fails
 */
function screenToLatLon(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  camera: THREE.OrthographicCamera,
  center: { latitude: number; longitude: number },
  scale: number,
): { latitude: number; longitude: number } | null {
  // Get canvas position in the viewport
  const rect = canvas.getBoundingClientRect();

  // Convert client coordinates to canvas-relative coordinates
  const canvasX = x - rect.left;
  const canvasY = y - rect.top;

  // Convert to normalized device coordinates (NDC) centered on the canvas
  const ndcX = canvasX - rect.width / 2;
  const ndcY = canvasY - rect.height / 2;

  // Convert to world coordinates using camera parameters
  const zoom = camera.zoom;
  const panX = camera.position.x;
  const panY = camera.position.y;

  // Apply zoom and pan to get world coordinates
  const worldX = ndcX / zoom + panX;
  const worldY = ndcY / zoom + panY;

  // Convert world coordinates to lat/lon
  const longitude = worldX / scale + center.longitude;
  const latitude = center.latitude - worldY / scale;

  return { latitude, longitude };
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

  // --- Tooltip State ---
  const [tooltip, setTooltip] = useState<null | {
    x: number;
    y: number;
    content: string;
  }>(null);

  // --- Layer Visibility State ---
  const [showCoastline, setShowCoastline] = useState(true);
  const [showBuoys, setShowBuoys] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // --- Editable Route State ---
  const [editableRoute, setEditableRoute] = useState(route ?? mockRoute);
  // --- Selected Waypoint State ---
  const [selectedWp, setSelectedWp] = useState<number | null>(null);

  // --- EBL & VRM State ---
  const [ebl1, setEbl1] = useState<EBLState>({
    id: 'EBL1',
    isActive: false,
    bearing: 0,
    origin: 'ship',
  });
  const [ebl2, setEbl2] = useState<EBLState>({
    id: 'EBL2',
    isActive: false,
    bearing: 90,
    origin: 'ship',
  });
  const [vrm1, setVrm1] = useState<VRMState>({
    id: 'VRM1',
    isActive: false,
    radius: 1,
    origin: 'ship',
  });
  const [vrm2, setVrm2] = useState<VRMState>({
    id: 'VRM2',
    isActive: false,
    radius: 2,
    origin: 'ship',
  });

  // --- AIS State ---
  const [aisTargets, setAisTargets] = useState(mockAisTargets);

  // --- Chart Layer Management State ---
  const [chartLayers, setChartLayers] = useState([
    { id: 'vector', name: 'Vector Chart', visible: true, opacity: 1 },
    { id: 'raster', name: 'Raster Chart', visible: false, opacity: 0.7 },
  ]);

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<null | {
    type: string;
    index: number;
  }>(null);

  // --- Measurement Tool State ---
  const [measurementMode, setMeasurementMode] = useState<boolean>(false);
  const [measurementStart, setMeasurementStart] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [measurementEnd, setMeasurementEnd] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const isMeasuringRef = useRef(false);

  // --- Search Handler ---
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    // Search waypoints
    for (let i = 0; i < editableRoute.length; i++) {
      if (`waypoint #${i + 1}`.toLowerCase().includes(q)) {
        setSearchResult({ type: 'waypoint', index: i });
        return;
      }
    }
    // Search buoys
    for (let i = 0; i < buoys.length; i++) {
      if ((buoys[i].type || '').toLowerCase().includes(q)) {
        setSearchResult({ type: 'buoy', index: i });
        return;
      }
    }
    // Search AIS targets
    for (let i = 0; i < aisTargets.length; i++) {
      if (
        (aisTargets[i].name || '').toLowerCase().includes(q) ||
        (aisTargets[i].mmsi || '').toLowerCase().includes(q)
      ) {
        setSearchResult({ type: 'ais', index: i });
        return;
      }
    }
    setSearchResult(null);
  }

  // --- Auto-pan to search result ---
  useEffect(() => {
    if (!searchResult) return;
    let lat = 0,
      lon = 0;
    if (searchResult.type === 'waypoint') {
      lat = editableRoute[searchResult.index].latitude;
      lon = editableRoute[searchResult.index].longitude;
    } else if (searchResult.type === 'buoy') {
      lat = buoys[searchResult.index].latitude;
      lon = buoys[searchResult.index].longitude;
    } else if (searchResult.type === 'ais') {
      lat = aisTargets[searchResult.index].lat;
      lon = aisTargets[searchResult.index].lon;
    }
    // Center camera on found object
    panRef.current.x = (lon - center.longitude) * scale;
    panRef.current.y = -(lat - center.latitude) * scale;
    if (cameraRef.current) {
      cameraRef.current.position.x = panRef.current.x;
      cameraRef.current.position.y = panRef.current.y;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [searchResult]);

  // --- Chart Layer UI Handlers ---
  function toggleLayer(id: string) {
    setChartLayers(layers =>
      layers.map(l => (l.id === id ? { ...l, visible: !l.visible } : l)),
    );
  }
  function setLayerOpacity(id: string, opacity: number) {
    setChartLayers(layers =>
      layers.map(l => (l.id === id ? { ...l, opacity } : l)),
    );
  }
  function moveLayer(id: string, dir: 'up' | 'down') {
    setChartLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx < 0) return layers;
      const newIdx =
        dir === 'up'
          ? Math.max(0, idx - 1)
          : Math.min(layers.length - 1, idx + 1);
      if (idx === newIdx) return layers;
      const arr = [...layers];
      const [removed] = arr.splice(idx, 1);
      arr.splice(newIdx, 0, removed);
      return arr;
    });
  }

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

  // --- Scale Bar Calculation ---
  function getScaleBar() {
    // Pick a nice round distance for the scale bar (in meters)
    const zoom = cameraRef.current?.zoom || 1;
    // 100 pixels in world units
    const worldDist = 100 / zoom;
    // Convert worldDist to degrees longitude at center latitude
    const degLon = worldDist / scale;
    // Convert degrees to meters (approx, at center latitude)
    const metersPerDeg = 111320 * Math.cos((center.latitude * Math.PI) / 180);
    const meters = degLon * metersPerDeg;
    // Pick a nice round number for the label
    let label = '';
    let displayMeters = 0;
    if (meters > 1000) {
      displayMeters = Math.round(meters / 100) * 100;
      label = displayMeters / 1000 + ' km';
    } else if (meters > 100) {
      displayMeters = Math.round(meters / 10) * 10;
      label = displayMeters + ' m';
    } else {
      displayMeters = Math.round(meters);
      label = displayMeters + ' m';
    }
    // Convert back to pixel length
    const px = (displayMeters / metersPerDeg) * scale * zoom;
    return { px, label };
  }

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

  // --- Enhanced Mouse Move Handler for Tooltip ---
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const canvas = renderer.domElement;

    function onPointerMove(e: PointerEvent) {
      const camera = cameraRef.current;
      if (!camera) return;

      // Use consistent coordinate calculation
      const point = screenToLatLon(
        e.clientX,
        e.clientY,
        canvas,
        camera,
        center,
        scale,
      );

      if (!point) return;

      setCursorlatitudeLon(point);

      // Calculate hit testing directly in world space using consistent calculations
      const hitTestRadiusWorld = 10 / camera.zoom; // Convert 10 px to world units

      // === Hit test for tooltip using world coordinates ===

      // 1. Waypoints
      for (const wp of editableRoute) {
        // Convert both cursor and waypoint to world coordinates for consistent comparison
        const [wpX, wpY] = latLonToXY(wp.latitude, wp.longitude, center, scale);
        const [ptX, ptY] = latLonToXY(
          point.latitude,
          point.longitude,
          center,
          scale,
        );

        const dx = wpX - ptX;
        const dy = wpY - ptY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hitTestRadiusWorld) {
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            content: `Waypoint #${editableRoute.indexOf(wp) + 1}\nLat: ${wp.latitude.toFixed(5)}\nLon: ${wp.longitude.toFixed(5)}`,
          });
          return;
        }
      }

      // 2. Buoys
      for (const buoy of buoys) {
        const [bX, bY] = latLonToXY(
          buoy.latitude,
          buoy.longitude,
          center,
          scale,
        );
        const [ptX, ptY] = latLonToXY(
          point.latitude,
          point.longitude,
          center,
          scale,
        );

        const dx = bX - ptX;
        const dy = bY - ptY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hitTestRadiusWorld) {
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            content: `Buoy (${buoy.type})\nLat: ${buoy.latitude.toFixed(5)}\nLon: ${buoy.longitude.toFixed(5)}`,
          });
          return;
        }
      }

      // 3. AIS Targets
      for (const target of aisTargets) {
        const [tX, tY] = latLonToXY(target.lat, target.lon, center, scale);
        const [ptX, ptY] = latLonToXY(
          point.latitude,
          point.longitude,
          center,
          scale,
        );

        const dx = tX - ptX;
        const dy = tY - ptY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // AIS targets might need a slightly larger hit area
        if (distance < hitTestRadiusWorld * 1.2) {
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            content: `AIS: ${target.name || target.mmsi}\nLat: ${target.lat.toFixed(5)}\nLon: ${target.lon.toFixed(5)}\nHeading: ${target.heading}°\nSpeed: ${target.speed} kn`,
          });
          return;
        }
      }

      setTooltip(null);
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', () => {
      setCursorlatitudeLon(null);
      setTooltip(null);
    });

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', () => {
        setCursorlatitudeLon(null);
        setTooltip(null);
      });
    };
  }, [size, scale, center, editableRoute, buoys, aisTargets]);

  // --- Add/Move/Delete Waypoint Handlers ---
  useEffect(() => {
    if (measurementMode) return; // Disable route editing when measuring
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
  }, [editableRoute, size, scale, center, measurementMode]);

  // --- Measurement Tool Mouse Handlers ---
  useEffect(() => {
    if (!measurementMode) return;

    const renderer = rendererRef.current;
    if (!renderer) return;

    const canvas = renderer.domElement;

    function onPointerDown(e: PointerEvent) {
      const camera = cameraRef.current;
      if (!camera) return;

      const point = screenToLatLon(
        e.clientX,
        e.clientY,
        canvas,
        camera,
        center,
        scale,
      );

      if (!point) return;

      setMeasurementStart(point);
      setMeasurementEnd(point);
      isMeasuringRef.current = true;
    }

    function onPointerMove(e: PointerEvent) {
      if (!isMeasuringRef.current) return;

      const camera = cameraRef.current;
      if (!camera) return;

      const point = screenToLatLon(
        e.clientX,
        e.clientY,
        canvas,
        camera,
        center,
        scale,
      );

      if (!point) return;
      setMeasurementEnd(point);
    }

    function onPointerUp() {
      isMeasuringRef.current = false;
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [measurementMode, size, scale, center]);

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

    // --- Chart Layers ---
    chartLayers.forEach(layer => {
      if (!layer.visible) return;
      if (layer.id === 'vector') {
        // Vector chart: draw coastline as before, with opacity
        if (showCoastline) {
          const coastShape = new THREE.Shape();
          coastline.forEach(([latitude, longitude], i) => {
            const [x, y] = latLonToXY(latitude, longitude, center, scale);
            if (i === 0) coastShape.moveTo(x, y);
            else coastShape.lineTo(x, y);
          });
          const coastGeom = new THREE.ShapeGeometry(coastShape);
          const coastMat = new THREE.MeshBasicMaterial({
            color: 0xb7c9a7,
            transparent: true,
            opacity: layer.opacity,
          });
          const coastMesh = new THREE.Mesh(coastGeom, coastMat);
          scene.add(coastMesh);
          // Coastline outline
          const coastLineMat = new THREE.LineBasicMaterial({
            color: 0x7a8c6e,
            linewidth: 2,
            transparent: true,
            opacity: layer.opacity,
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
      } else if (layer.id === 'raster') {
        // Raster chart: draw a semi-transparent colored rectangle as a mock
        const rasterGeom = new THREE.PlaneGeometry(size, size);
        const rasterMat = new THREE.MeshBasicMaterial({
          color: 0x3b4252,
          transparent: true,
          opacity: layer.opacity,
        });
        const rasterMesh = new THREE.Mesh(rasterGeom, rasterMat);
        rasterMesh.position.set(0, 0, 0.5);
        scene.add(rasterMesh);
      }
    });

    // --- Buoys ---
    if (showBuoys) {
      buoys.forEach((b, i) => {
        const [x, y] = latLonToXY(b.latitude, b.longitude, center, scale);
        const isSearched =
          searchResult?.type === 'buoy' && searchResult.index === i;
        const buoyGeom = new THREE.CircleGeometry(isSearched ? 12 : 7, 24);
        const buoyMat = new THREE.MeshBasicMaterial({
          color: isSearched
            ? 0x34d399
            : b.type === 'starboard'
              ? 0x2dd4bf
              : 0xf87171,
        });
        const buoyMesh = new THREE.Mesh(buoyGeom, buoyMat);
        buoyMesh.position.set(x, y, 2);
        scene.add(buoyMesh);
        // Outline
        const outlineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const outlineGeom = new THREE.CircleGeometry(isSearched ? 12 : 7, 24);
        const outlineVertices = outlineGeom.getAttribute('position');
        const outlinePoints: THREE.Vector3[] = [];
        for (let j = 0; j < outlineVertices.count; j++) {
          outlinePoints.push(
            new THREE.Vector3(
              outlineVertices.getX(j),
              outlineVertices.getY(j),
              outlineVertices.getZ(j),
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
        const isSearched =
          searchResult?.type === 'waypoint' && searchResult.index === i;
        const wpGeom = new THREE.CircleGeometry(
          isSelected ? 8 : isSearched ? 10 : 5,
          16,
        );
        const wpMat = new THREE.MeshBasicMaterial({
          color: isSearched ? 0x34d399 : isSelected ? 0xf87171 : 0xfbbf24,
        });
        const wpMesh = new THREE.Mesh(wpGeom, wpMat);
        wpMesh.position.set(x, y, 3.1);
        scene.add(wpMesh);
        // Outline
        const wpOutlineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wpOutlineGeom = new THREE.CircleGeometry(
          isSelected ? 8 : isSearched ? 10 : 5,
          16,
        );
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
    aisTargets.forEach((t, i) => {
      const [x, y] = latLonToXY(t.lat, t.lon, center, scale);
      const isSearched =
        searchResult?.type === 'ais' && searchResult.index === i;
      // Target icon (triangle)
      const tgtShape = new THREE.Shape();
      tgtShape.moveTo(0, isSearched ? -16 : -10);
      tgtShape.lineTo(isSearched ? 10 : 6, isSearched ? 14 : 8);
      tgtShape.lineTo(isSearched ? -10 : -6, isSearched ? 14 : 8);
      tgtShape.lineTo(0, isSearched ? -16 : -10);
      const tgtGeom = new THREE.ShapeGeometry(tgtShape);
      const tgtMat = new THREE.MeshBasicMaterial({
        color: isSearched ? 0xfbbf24 : 0x34d399,
      });
      const tgtMesh = new THREE.Mesh(tgtGeom, tgtMat);
      tgtMesh.position.set(x, y, 5);
      tgtMesh.rotation.z = -THREE.MathUtils.degToRad(t.heading ?? 0);
      scene.add(tgtMesh);
      // Label (simple, above target)
      const labelDiv = document.createElement('div');
      labelDiv.style.position = 'absolute';
      labelDiv.style.left = `${x + size / 2 - 20}px`;
      labelDiv.style.top = `${y + size / 2 - (isSearched ? 36 : 24)}px`;
      labelDiv.style.color = isSearched ? '#fbbf24' : '#34d399';
      labelDiv.style.fontSize = isSearched ? '15px' : '13px';
      labelDiv.style.fontFamily = 'monospace';
      labelDiv.style.pointerEvents = 'none';
      labelDiv.style.zIndex = '20';
      labelDiv.textContent = t.name || t.mmsi;
      if (mountRef.current) mountRef.current.appendChild(labelDiv);
      setTimeout(() => labelDiv.remove(), 0);
    });

    // --- Pan & Zoom Handlers ---
    const canvas = renderer.domElement;
    function onPointerDown(e: PointerEvent) {
      if (measurementMode) return;
      dragState.current = {
        dragging: true,
        lastX: e.clientX,
        lastY: e.clientY,
      };
    }
    function onPointerMove(e: PointerEvent) {
      if (measurementMode) return;
      if (dragState.current?.dragging) {
        const dx = e.clientX - dragState.current.lastX;
        const dy = e.clientY - dragState.current.lastY;
        panRef.current.x -= dx / cam.zoom;
        panRef.current.y += dy / cam.zoom;
        cam.position.x = panRef.current.x;
        cam.position.y = panRef.current.y;
        cam.updateProjectionMatrix();
        dragState.current.lastX = e.clientX;
        dragState.current.lastY = e.clientY;
      }
    }
    function onPointerUp() {
      if (measurementMode) return;
      if (dragState.current) dragState.current.dragging = false;
    }
    function onWheel(e: WheelEvent) {
      if (measurementMode) return;
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
      // Clear previous EBLs and VRMs
      scene.children
        .filter(obj => obj.userData.isEBL || obj.userData.isVRM)
        .forEach(obj => scene.remove(obj));

      // Draw EBLs
      [ebl1, ebl2].forEach(ebl => {
        if (ebl.isActive) {
          const [originX, originY] = ebl.origin === 'ship' ? [sx, sy] : [0, 0]; // Assuming 0,0 for chart center if not ship
          const length = size * 2; // Make line long enough to cross the screen
          const angleRad = THREE.MathUtils.degToRad(90 - ebl.bearing); // Adjust for Three.js coordinate system
          const endX = originX + length * Math.cos(angleRad);
          const endY = originY + length * Math.sin(angleRad);

          const eblMaterial = new THREE.LineBasicMaterial({
            color: 0xfbbf24,
            linewidth: 1,
          });
          const eblPoints = [
            new THREE.Vector3(originX, originY, 6),
            new THREE.Vector3(endX, endY, 6),
          ];
          const eblGeometry = new THREE.BufferGeometry().setFromPoints(
            eblPoints,
          );
          const eblLine = new THREE.Line(eblGeometry, eblMaterial);
          eblLine.userData.isEBL = true;
          scene.add(eblLine);
        }
      });

      // Draw VRMs
      [vrm1, vrm2].forEach(vrm => {
        if (vrm.isActive) {
          const [originX, originY] = vrm.origin === 'ship' ? [sx, sy] : [0, 0]; // Assuming 0,0 for chart center if not ship
          // Convert NM to pixels: 1 NM = 1852 meters. Scale is meters per degree.
          // This is a rough approximation and needs proper projection for accuracy.
          const radiusInMeters = vrm.radius * 1852;
          const radiusInPixels =
            (radiusInMeters /
              (111320 * Math.cos((center.latitude * Math.PI) / 180))) *
            scale;

          const vrmMaterial = new THREE.LineBasicMaterial({
            color: 0x34d399,
            linewidth: 1,
          });
          const vrmCircleGeometry = new THREE.CircleGeometry(
            radiusInPixels,
            64,
          );
          // Remove the center vertex to make it a line loop
          const positions =
            vrmCircleGeometry.attributes.position.array.slice(3); // Remove first vertex (center)
          const vrmGeometry = new THREE.BufferGeometry();
          vrmGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3),
          );
          const vrmCircle = new THREE.LineLoop(vrmGeometry, vrmMaterial);
          vrmCircle.position.set(originX, originY, 6);
          vrmCircle.userData.isVRM = true;
          scene.add(vrmCircle);
        }
      });

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
  }, [
    shipPosition,
    route,
    chartData,
    showCoastline,
    showBuoys,
    showRoute,
    chartLayers,
    searchResult,
    measurementMode,
    ebl1,
    ebl2,
    vrm1,
    vrm2,
  ]);

  // --- Overlay Info (static for MVP) ---
  const navDataForPanel = {
    hdg: `${ship.heading?.toFixed(1)}°`,
    hdgStatus: 'SNR', // Mocked
    spd: '50.0kn', // Mocked, replace with actual ship.speed when available
    spdStatus: 'SNR', // Mocked
    wt: '0.0kn', // Mocked
    cog: '0.0°', // Mocked, replace with actual COG when available
    cogStatus: 'NON', // Mocked
    sog: '0.0kn', // Mocked, replace with actual SOG when available
    sogStatus: 'NON', // Mocked
    posn_lat: `${ship.latitude.toFixed(5)}' N`,
    posn_lon: `${ship.longitude.toFixed(5)}' E`,
    posnFilter: 'H', // Mocked
    offset: 'Offset', // Mocked label
    wgs84: 'WGS84', // Mocked
  };

  // Schema definition for the RightStatusPanel
  const panelSchema: StatusPanelSchema = [
    [
      {
        id: 'hdg',
        label: 'HDG',
        mainValue: {
          text: 'data:hdg',
          className: 'text-2xl text-green-400 font-bold',
        },
        statusValue: {
          text: 'data:hdgStatus',
          className: 'text-xs text-gray-400 self-end pb-0.5',
        },
        boxClassName: 'flex-grow',
      },
    ],
    [
      {
        id: 'spd',
        label: 'SPD',
        mainValue: {
          text: 'data:spd',
          className: 'text-xl text-white font-bold',
        },
        statusValue: {
          text: 'data:spdStatus',
          className: 'text-xs text-gray-400 self-end',
        },
        boxClassName: 'w-1/2',
      },
      {
        id: 'wt',
        label: 'WT',
        mainValue: {
          text: 'data:wt',
          className: 'text-xl text-white font-bold',
        },
        boxClassName: 'w-1/2',
      },
    ],
    [
      {
        id: 'cog',
        label: 'COG',
        mainValue: {
          text: 'data:cog',
          className: 'text-xl text-white font-bold',
        },
        statusValue: {
          text: 'data:cogStatus',
          className: 'text-xs text-gray-400 self-end',
        },
        boxClassName: 'w-1/2',
      },
      {
        id: 'sog',
        label: 'SOG',
        mainValue: {
          text: 'data:sog',
          className: 'text-xl text-white font-bold',
        },
        statusValue: {
          text: 'data:sogStatus',
          className: 'text-xs text-gray-400 self-end',
        },
        boxClassName: 'w-1/2',
      },
    ],
    [
      {
        id: 'posn',
        label: 'POSN',
        additionalLines: [
          { text: 'data:posn_lat', className: 'text-sm text-white' },
          { text: 'data:posn_lon', className: 'text-sm text-white' },
        ],
        statusValue: {
          text: 'data:posnFilter',
          className: 'text-xs text-gray-400 self-start pt-0.5',
        }, // Aligned with label
        boxClassName: 'flex-grow',
      },
    ],
    [
      {
        id: 'offset',
        label: 'Offset', // This seems to be a label for the WGS84 value based on image
        mainValue: {
          text: 'data:wgs84',
          className: 'text-sm text-white text-center',
        }, // Centered as it takes full width
        boxClassName: 'flex-grow',
      },
    ],
  ];

  // --- Route Info Section (mocked for now) ---
  const routeInfo: Array<{ label: string; value: string }> = [
    { label: 'Route', value: 'Helsinki → Tallinn' },
    { label: 'Plan SPD', value: '16.0 kn' },
    { label: 'Plan CRS', value: '187.0°' },
    { label: 'CRS to STR', value: '187.5°' },
    { label: 'CH limit', value: '50 m' },
    { label: 'Off track', value: '12 m' },
    { label: 'HAND', value: 'AUTO' },
    { label: 'To WPT', value: 'WP3' },
    { label: 'Dist WPT', value: '2.1 nm' },
    { label: 'Time', value: '00:08' },
    { label: 'Turn RAD', value: '0.2 nm' },
    { label: 'Turn rate', value: '12°/min' },
    { label: 'UKC', value: '8.5 m' },
    { label: 'Next WPT', value: 'WP4' },
    { label: 'Next', value: '195.0°' },
  ];

  return (
    <div
      style={{
        background: '#1a2230',
        borderRadius: 12,
        boxShadow: '0 2px 12px #0008',
        padding: 0,
        width: size + 232, // extra width for right panel
        color: '#e0f2f1',
        fontFamily: 'monospace',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 100px)', // Example: Adjust as needed for your app layout
      }}
    >
      <TopNavigationBar
        tabs={['NAVI', 'CHARTS', 'PLAN', 'OTHERS']}
        activeTab={'NAVI'}
        brand={'ECDIS'}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          flexGrow: 1,
        }}
      >
        <div
          style={{
            flexGrow: 1,
            width: size + 32,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Controls above the chart */}
          <div style={{ marginBottom: 8 }}></div>
          {/* Measurement Tool Toggle */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 15, marginRight: 12 }}>
              <input
                type="checkbox"
                checked={measurementMode}
                onChange={e => {
                  setMeasurementMode(e.target.checked);
                  setMeasurementStart(null);
                  setMeasurementEnd(null);
                }}
                style={{ marginRight: 6 }}
              />
              Measurement Tool
            </label>
            {measurementMode && (
              <span style={{ color: '#60a5fa', fontSize: 15, marginLeft: 8 }}>
                Click and drag to measure distance/bearing
              </span>
            )}
          </div>
          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: 8, marginBottom: 8 }}
          >
            <input
              type="text"
              placeholder="Search waypoint, buoy, AIS..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                fontSize: 15,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid #444',
                background: '#23272e',
                color: '#e0f2f1',
                width: 220,
              }}
            />
            <button
              type="submit"
              style={{
                fontSize: 15,
                padding: '2px 12px',
                borderRadius: 4,
                background: '#60a5fa',
                color: '#fff',
                border: 'none',
              }}
            >
              Search
            </button>
            {searchResult && (
              <span style={{ color: '#34d399', fontSize: 15, marginLeft: 8 }}>
                Found {searchResult.type} #{searchResult.index + 1}
              </span>
            )}
          </form>
          {/* Chart Layer Toggles */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 8,
            }}
          >
            {chartLayers.map((layer, i) => (
              <div
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#23272e',
                  borderRadius: 6,
                  padding: '2px 8px',
                }}
              >
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => toggleLayer(layer.id)}
                />
                <span>{layer.name}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={layer.opacity}
                  onChange={e =>
                    setLayerOpacity(layer.id, parseFloat(e.target.value))
                  }
                  style={{ width: 60 }}
                />
                <button
                  onClick={() => moveLayer(layer.id, 'up')}
                  disabled={i === 0}
                  style={{ fontSize: 12 }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLayer(layer.id, 'down')}
                  disabled={i === chartLayers.length - 1}
                  style={{ fontSize: 12 }}
                >
                  ↓
                </button>
              </div>
            ))}
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
          {/* This is the chartViewPort - set to grow */}
          <div
            style={{
              flexGrow: 1,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#22304a',
              position: 'relative',
              minHeight: 300,
            }}
          >
            <div
              ref={mountRef}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
              }}
            />
            {/* Measurement Line Overlay (SVG) */}
            {measurementMode &&
              measurementStart &&
              measurementEnd &&
              (() => {
                const camera = cameraRef.current;
                if (!camera) return null;

                // Calculate coordinates including pan and zoom
                const zoom = camera.zoom;
                const panX = camera.position.x;
                const panY = camera.position.y;

                // Project lat/lon to screen coordinates
                const [x1, y1] = latLonToXY(
                  measurementStart.latitude,
                  measurementStart.longitude,
                  center,
                  scale,
                );

                const [x2, y2] = latLonToXY(
                  measurementEnd.latitude,
                  measurementEnd.longitude,
                  center,
                  scale,
                );

                // Apply zoom and pan to the points for correct positioning in the SVG
                const svgX1 = (x1 - panX) * zoom + size / 2;
                const svgY1 = (y1 - panY) * zoom + size / 2;
                const svgX2 = (x2 - panX) * zoom + size / 2;
                const svgY2 = (y2 - panY) * zoom + size / 2;

                const { distance, bearing } = calculateDistanceAndBearing(
                  measurementStart.latitude,
                  measurementStart.longitude,
                  measurementEnd.latitude,
                  measurementEnd.longitude,
                );

                return (
                  <svg
                    width={size}
                    height={size}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <line
                      x1={svgX1}
                      y1={svgY1}
                      x2={svgX2}
                      y2={svgY2}
                      stroke="#60a5fa"
                      strokeWidth={1}
                      strokeDasharray=""
                    />
                    <text
                      x={(svgX1 + svgX2) / 2 + 10}
                      y={(svgY1 + svgY2) / 2 - 10}
                      fill="#fff"
                      fontSize={18}
                      fontFamily="monospace"
                      stroke="#23272e"
                      strokeWidth={0.5}
                      paintOrder="stroke"
                    >
                      {distance > 1000
                        ? `${(distance / 1000).toFixed(2)} km`
                        : `${distance.toFixed(1)} m`}{' '}
                      | {bearing.toFixed(1)}°
                    </text>
                  </svg>
                );
              })()}
            {/* Scale Bar & EBL Controls Overlay */}
            <div // Container for EBLs and Scale Bar
              style={{
                position: 'absolute',
                left: 32,
                bottom: 32,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <EBLControl eblState={ebl1} setEblState={setEbl1} />
              <EBLControl eblState={ebl2} setEblState={setEbl2} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: getScaleBar().px,
                    height: 6,
                    background: '#e0f2f1',
                    borderRadius: 2,
                    boxShadow: '0 1px 4px #0008',
                  }}
                />
                <span style={{ color: '#e0f2f1', fontSize: 14 }}>
                  {getScaleBar().label}
                </span>
              </div>
            </div>

            {/* North Arrow Overlay */}
            <div
              style={{
                position: 'absolute',
                right: 32,
                top: 32,
                zIndex: 20,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36">
                <polygon
                  points="18,6 24,30 18,24 12,30"
                  fill="#e0f2f1"
                  stroke="#23272e"
                  strokeWidth="2"
                />
                <text
                  x="18"
                  y="20"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#23272e"
                  fontFamily="monospace"
                >
                  N
                </text>
              </svg>
            </div>

            {/* VRM Controls Overlay */}
            <div
              style={{
                position: 'absolute',
                right: 32,
                bottom: 32,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <VRMControl vrmState={vrm1} setVrmState={setVrm1} />
              <VRMControl vrmState={vrm2} setVrmState={setVrm2} />
            </div>
          </div>{' '}
          {/* End of chartViewPort */}
          {/* latitude/longitude Overlay */}
          {cursorlatitudeLon && (
            <div
              style={{
                marginTop: 8,
                background: '#23272e',
                color: '#e0f2f1',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 15,
                pointerEvents: 'none',
                textAlign: 'center',
              }}
            >
              Lat: {cursorlatitudeLon.latitude.toFixed(5)}, Lon:{' '}
              {cursorlatitudeLon.longitude.toFixed(5)}
            </div>
          )}
          {/* Tooltip Overlay */}
          {tooltip && (
            <div
              style={{
                position: 'fixed',
                left: tooltip.x + 16,
                top: tooltip.y + 8,
                background: '#23272e',
                color: '#e0f2f1',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 15,
                whiteSpace: 'pre',
                pointerEvents: 'none',
                zIndex: 100,
                boxShadow: '0 2px 8px #000a',
              }}
            >
              {tooltip.content}
            </div>
          )}
        </div>
        <RightStatusPanel schema={panelSchema} data={navDataForPanel}>
          <RouteInfoPanel routeInfo={routeInfo} />
        </RightStatusPanel>
      </div>
    </div>
  );
};
