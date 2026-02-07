import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { VesselState } from '../../types/vessel.types';

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

function latLonToXY(
  latitude: number,
  longitude: number,
  center: { latitude: number; longitude: number },
  scale: number,
) {
  return [
    (longitude - center.longitude) * scale,
    -(latitude - center.latitude) * scale,
  ] as const;
}

function worldFromShip(
  ox: number,
  oy: number,
  headingDeg: number,
  forward: number,
  starboard: number,
) {
  const rad = (headingDeg * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const x = ox + forward * sin + starboard * cos;
  const y = oy + forward * cos - starboard * sin;
  return { x, y };
}

function formatLatLon(
  value: number | undefined,
  positive: string,
  negative: string,
) {
  if (value === undefined || Number.isNaN(value)) return '--';
  const hemi = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(5)}${hemi}`;
}

export interface EcdisDisplayProps {
  shipPosition?: VesselState['position'];
  heading?: VesselState['orientation']['heading'];
  route?: Array<{ latitude: number; longitude: number }>;
  aisTargets?: {
    lat: number;
    lon: number;
    name: string;
    mmsi: string;
    heading: number;
    speed: number;
  }[];
  chartData?: {
    coastline: Array<[number, number]>;
    buoys: Array<{ latitude: number; longitude: number; type: string }>;
  };
}

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
    [shipPosition, heading, center.latitude, center.longitude],
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

    // Defensive cleanup for fast-refresh/remount edge cases:
    // ensure this mount point starts empty so only one canvas exists.
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

  function screenToLatLon(clientX: number, clientY: number) {
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
  }

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
  }, [center, editableRoute, scale]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    scene.clear();

    const chartGroup = new THREE.Group();
    scene.add(chartGroup);

    const coastFill = new THREE.Shape();
    coastline.forEach(([latitude, longitude], index) => {
      const [x, y] = latLonToXY(latitude, longitude, center, scale);
      if (index === 0) coastFill.moveTo(x, y);
      else coastFill.lineTo(x, y);
    });

    chartGroup.add(
      new THREE.Mesh(
        new THREE.ShapeGeometry(coastFill),
        new THREE.MeshBasicMaterial({
          color: 0xbca95b,
          transparent: true,
          opacity: 0.95,
        }),
      ),
    );

    const coastLine = coastline.map(([latitude, longitude]) => {
      const [x, y] = latLonToXY(latitude, longitude, center, scale);
      return new THREE.Vector3(x, y, 1);
    });
    chartGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(coastLine),
        new THREE.LineBasicMaterial({ color: 0x71662f }),
      ),
    );

    buoys.forEach(buoy => {
      const [x, y] = latLonToXY(buoy.latitude, buoy.longitude, center, scale);
      chartGroup
        .add(
          new THREE.Mesh(
            new THREE.CircleGeometry(6, 20),
            new THREE.MeshBasicMaterial({
              color: buoy.type === 'starboard' ? 0x12b8ff : 0xe95f50,
            }),
          ),
        )
        .position.set(x, y, 2);
    });

    const routeLine = editableRoute.map(wp => {
      const [x, y] = latLonToXY(wp.latitude, wp.longitude, center, scale);
      return new THREE.Vector3(x, y, 2.5);
    });

    if (routeLine.length > 1) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(routeLine),
        new THREE.LineDashedMaterial({
          color: 0xff6bd6,
          dashSize: 10,
          gapSize: 7,
        }),
      );
      line.computeLineDistances();
      chartGroup.add(line);
    }

    editableRoute.forEach(wp => {
      const [x, y] = latLonToXY(wp.latitude, wp.longitude, center, scale);
      chartGroup
        .add(
          new THREE.Mesh(
            new THREE.CircleGeometry(5, 18),
            new THREE.MeshBasicMaterial({ color: 0xf6e866 }),
          ),
        )
        .position.set(x, y, 3);
    });

    const [shipX, shipY] = latLonToXY(
      ship.latitude,
      ship.longitude,
      center,
      scale,
    );
    // Own-ship outline: thin pill with pointed bow.
    const hullLen = 38 * OWN_SHIP_VISUAL_SCALE;
    const hullHalfBeam = 3.4 * OWN_SHIP_VISUAL_SCALE;
    const sternRound = 5.2 * OWN_SHIP_VISUAL_SCALE;
    const bowPoint = 8 * OWN_SHIP_VISUAL_SCALE;
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-hullHalfBeam, -hullLen / 2 + sternRound);
    hullShape.absarc(
      0,
      -hullLen / 2 + sternRound,
      sternRound,
      Math.PI,
      0,
      false,
    );
    hullShape.lineTo(hullHalfBeam, hullLen / 2 - bowPoint);
    hullShape.lineTo(0, hullLen / 2);
    hullShape.lineTo(-hullHalfBeam, hullLen / 2 - bowPoint);
    hullShape.lineTo(-hullHalfBeam, -hullLen / 2 + sternRound);
    const hullOutlinePoints = hullShape
      .getPoints(64)
      .map(p => new THREE.Vector3(p.x, p.y, 0));
    const ownShip = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(hullOutlinePoints),
      new THREE.LineBasicMaterial({ color: 0xdce9f2 }),
    );
    ownShip.position.set(shipX, shipY, 8.2);
    ownShip.rotation.z = -THREE.MathUtils.degToRad(ship.heading);
    chartGroup.add(ownShip);

    const bow = worldFromShip(shipX, shipY, ship.heading, hullLen / 2, 0);
    const navPoint = worldFromShip(
      shipX,
      shipY,
      ship.heading,
      7 * OWN_SHIP_VISUAL_SCALE,
      0,
    );

    // Heading line from bow.
    const headingEnd = worldFromShip(shipX, shipY, ship.heading, 170, 0);
    chartGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(bow.x, bow.y, 8.1),
          new THREE.Vector3(headingEnd.x, headingEnd.y, 8.1),
        ]),
        new THREE.LineBasicMaterial({ color: 0x12181d }),
      ),
    );

    // COG/SOG vector slightly offset from heading with ticks and arrow.
    const cogOffsetDeg = 7;
    const cogVectorDeg = ship.heading + cogOffsetDeg;
    const cogLen = 190 * OWN_SHIP_VISUAL_SCALE;
    const cogEnd = worldFromShip(bow.x, bow.y, cogVectorDeg, cogLen, 0);
    chartGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(bow.x, bow.y, 8.0),
          new THREE.Vector3(cogEnd.x, cogEnd.y, 8.0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x1d1d1d }),
      ),
    );
    const arrowLeft = worldFromShip(
      cogEnd.x,
      cogEnd.y,
      cogVectorDeg,
      -8 * OWN_SHIP_VISUAL_SCALE,
      -3 * OWN_SHIP_VISUAL_SCALE,
    );
    const arrowRight = worldFromShip(
      cogEnd.x,
      cogEnd.y,
      cogVectorDeg,
      -8 * OWN_SHIP_VISUAL_SCALE,
      3 * OWN_SHIP_VISUAL_SCALE,
    );
    chartGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(arrowLeft.x, arrowLeft.y, 8.0),
          new THREE.Vector3(cogEnd.x, cogEnd.y, 8.0),
          new THREE.Vector3(arrowRight.x, arrowRight.y, 8.0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x1d1d1d }),
      ),
    );
    for (let i = 1; i <= 12; i += 1) {
      const along = i * 12 * OWN_SHIP_VISUAL_SCALE;
      const major = i % 4 === 0;
      const tickHalf = (major ? 2.6 : 1.4) * OWN_SHIP_VISUAL_SCALE;
      const p1 = worldFromShip(bow.x, bow.y, cogVectorDeg, along, -tickHalf);
      const p2 = worldFromShip(bow.x, bow.y, cogVectorDeg, along, tickHalf);
      chartGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(p1.x, p1.y, 8.0),
            new THREE.Vector3(p2.x, p2.y, 8.0),
          ]),
          new THREE.LineBasicMaterial({ color: major ? 0x101010 : 0x2a2a2a }),
        ),
      );
    }

    // Beam line through nav point, crossing the ship breadth.
    const beamLeft = worldFromShip(
      navPoint.x,
      navPoint.y,
      ship.heading,
      0,
      -18 * OWN_SHIP_VISUAL_SCALE,
    );
    const beamRight = worldFromShip(
      navPoint.x,
      navPoint.y,
      ship.heading,
      0,
      18 * OWN_SHIP_VISUAL_SCALE,
    );
    chartGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(beamLeft.x, beamLeft.y, 8.1),
          new THREE.Vector3(beamRight.x, beamRight.y, 8.1),
        ]),
        new THREE.LineBasicMaterial({ color: 0x4e5b65 }),
      ),
    );

    // Past track from nav point aft with evenly spaced time ticks.
    const pastLen = 130 * OWN_SHIP_VISUAL_SCALE;
    const pastEnd = worldFromShip(
      navPoint.x,
      navPoint.y,
      ship.heading,
      -pastLen,
      0,
    );
    chartGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(navPoint.x, navPoint.y, 7.9),
          new THREE.Vector3(pastEnd.x, pastEnd.y, 7.9),
        ]),
        new THREE.LineBasicMaterial({ color: 0x111111 }),
      ),
    );
    for (let i = 1; i <= 12; i += 1) {
      const along = -i * 10 * OWN_SHIP_VISUAL_SCALE;
      const major = i % 4 === 0;
      const tickHalf = (major ? 2.8 : 1.6) * OWN_SHIP_VISUAL_SCALE;
      const p1 = worldFromShip(
        navPoint.x,
        navPoint.y,
        ship.heading,
        along,
        -tickHalf,
      );
      const p2 = worldFromShip(
        navPoint.x,
        navPoint.y,
        ship.heading,
        along,
        tickHalf,
      );
      chartGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(p1.x, p1.y, 7.9),
            new THREE.Vector3(p2.x, p2.y, 7.9),
          ]),
          new THREE.LineBasicMaterial({ color: major ? 0x0e0e0e : 0x2a2a2a }),
        ),
      );
    }

    aisTargets?.forEach(target => {
      const [x, y] = latLonToXY(target.lat, target.lon, center, scale);
      const icon = new THREE.Mesh(
        new THREE.CircleGeometry(4, 12),
        new THREE.MeshBasicMaterial({ color: 0x3fe1ff }),
      );
      icon.position.set(x, y, 4);
      chartGroup.add(icon);
    });

    renderer.render(scene, camera);
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

  const buttonStyle: React.CSSProperties = {
    background: '#0c2ca8',
    border: '1px solid #2047dc',
    color: '#b9dbff',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 8px',
    cursor: 'pointer',
  };

  const valueBoxStyle: React.CSSProperties = {
    color: '#f3d648',
    background: '#000',
    border: '1px solid #2a4ac5',
    minWidth: 84,
    textAlign: 'right',
    padding: '0 6px',
    lineHeight: '18px',
    height: 20,
  };

  const rowLabelStyle: React.CSSProperties = {
    color: '#6cc9ff',
    fontWeight: 700,
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
  };

  const menuRowStyle: React.CSSProperties = {
    border: '1px solid #2a4ac5',
    background: '#0c2ca8',
    color: '#b9dbff',
    padding: '2px 8px',
    fontWeight: 700,
    marginBottom: 4,
    lineHeight: '16px',
  };

  const rowSingle = (label: string, value: string, unit?: string) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: unit ? '1fr auto auto' : '1fr auto',
        gap: 6,
        marginBottom: 3,
        alignItems: 'center',
      }}
    >
      <div style={rowLabelStyle}>{label}</div>
      <div style={valueBoxStyle}>{value}</div>
      {unit ? (
        <div style={{ ...valueBoxStyle, minWidth: 52, textAlign: 'center' }}>
          {unit}
        </div>
      ) : null}
    </div>
  );

  const rowDual = (
    label: string,
    left: string,
    right: string,
    leftMinWidth = 66,
    rightMinWidth = 84,
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 6,
        marginBottom: 3,
        alignItems: 'center',
      }}
    >
      <div style={rowLabelStyle}>{label}</div>
      <div
        style={{
          ...valueBoxStyle,
          minWidth: leftMinWidth,
          textAlign: 'center',
        }}
      >
        {left}
      </div>
      <div style={{ ...valueBoxStyle, minWidth: rightMinWidth }}>{right}</div>
    </div>
  );

  const rowTwoHeaders = (
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto auto auto',
        gap: 6,
        marginBottom: 3,
        alignItems: 'center',
      }}
    >
      <div style={rowLabelStyle}>{leftLabel}</div>
      <div style={{ ...valueBoxStyle, minWidth: 62, textAlign: 'center' }}>
        {leftValue}
      </div>
      <div style={rowLabelStyle}>{rightLabel}</div>
      <div style={{ ...valueBoxStyle, minWidth: 84, textAlign: 'center' }}>
        {rightValue}
      </div>
    </div>
  );

  const rowValueOnly = (value: string) => (
    <div style={{ marginBottom: 3 }}>
      <div style={{ ...valueBoxStyle, minWidth: 0, textAlign: 'left' }}>
        {value}
      </div>
    </div>
  );

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

      <aside
        style={{
          width: 290,
          background: '#00156a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            borderBottom: '2px solid #1739c9',
            padding: '5px 8px',
            fontWeight: 800,
          }}
        >
          KELVIN HUGHES ECDIS
        </div>
        <div style={{ padding: 8, overflowY: 'auto', flex: 1 }}>
          <div style={menuRowStyle}>Main Menu</div>

          {rowDual('Heading', 'T', `${ship.heading.toFixed(1)}\u00b0`)}
          {rowDual('Speed', 'W', '22.0 kts')}
          {rowDual('COG', 'DR', `${ship.heading.toFixed(1)}\u00b0`)}
          {rowDual('SOG', '', '22.0 kts')}
          {rowDual('Time', '+01H', '17:11:29')}
          {rowDual('Depth', 'Sim1', '22.3 m')}

          <div style={{ ...rowLabelStyle, marginTop: 4, marginBottom: 2 }}>
            Sensor
          </div>
          {rowValueOnly(
            `${formatLatLon(ship.latitude, 'N', 'S')} ${formatLatLon(ship.longitude, 'E', 'W')}`,
          )}
          {rowSingle('Datum', 'WGS84')}

          <div style={{ ...menuRowStyle, marginTop: 6 }}>Charts</div>
          <div style={{ ...menuRowStyle, marginBottom: 6 }}>Routes</div>

          <div
            style={{
              ...valueBoxStyle,
              textAlign: 'center',
              minWidth: 0,
              marginBottom: 3,
            }}
          >
            TRACK CONTROL
          </div>
          <div
            style={{
              ...valueBoxStyle,
              textAlign: 'center',
              minWidth: 0,
              marginBottom: 3,
            }}
          >
            Saltmere to Bonville
          </div>
          {rowSingle('Alt.', '(No Route Selected)')}

          <div
            style={{
              ...valueBoxStyle,
              minWidth: 0,
              marginBottom: 3,
              textAlign: 'center',
              color: '#90ffe1',
            }}
          >
            | . . . . A . /\\ . . . |
          </div>

          {rowTwoHeaders('XTE', '55 m', 'CTS', '064.0\u00b0')}
          {rowValueOnly('WP7 : Cartwheel Point')}
          {rowSingle('Dist to WOP', '1.64 nm')}
          {rowSingle('Time to WOP', '00:04:29')}
          {rowDual('ETA at final WP', '17:24', '03/01')}

          <div style={{ ...menuRowStyle, marginTop: 6 }}>Tools</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                border: '1px solid #2a4ac5',
                background: '#113d7a',
                height: 56,
              }}
            />
            <div>
              <div
                style={{
                  ...valueBoxStyle,
                  textAlign: 'left',
                  minWidth: 0,
                  marginBottom: 3,
                }}
              >
                {formatLatLon(ship.latitude, 'N', 'S')}
              </div>
              <div style={{ ...valueBoxStyle, textAlign: 'left', minWidth: 0 }}>
                {formatLatLon(ship.longitude, 'E', 'W')}
              </div>
            </div>
          </div>
          {rowDual('', 'Rng', '1.49 nm', 44, 96)}
          {rowDual('', 'Brg', '271.6\u00b0', 44, 96)}

          <div
            style={{
              marginTop: 6,
              marginBottom: 6,
              minHeight: 52,
              border: '1px solid #8c0000',
              background: '#d00000',
              color: '#ffe7e7',
              padding: '4px 6px',
              fontWeight: 700,
            }}
          >
            Track Control Stopped
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderTop: '2px solid #1739c9',
          }}
        >
          <button
            style={{ ...buttonStyle, borderWidth: 0, borderRightWidth: 1 }}
          >
            Select Query Feature
          </button>
          <button
            style={{ ...buttonStyle, borderWidth: 0, borderRightWidth: 1 }}
          >
            Action 2
          </button>
          <button style={{ ...buttonStyle, borderWidth: 0 }}>
            Context Menu
          </button>
        </div>
      </aside>
    </div>
  );
};
