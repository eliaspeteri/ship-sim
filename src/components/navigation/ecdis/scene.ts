import * as THREE from 'three';

import { latLonToXY, worldFromShip } from './math';

import type { EcdisAisTarget, EcdisBuoy, EcdisRoutePoint } from './types';

type LatLonCenter = { latitude: number; longitude: number };

type ShipState = {
  latitude: number;
  longitude: number;
  heading: number;
};

interface DrawEcdisSceneArgs {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  center: LatLonCenter;
  scale: number;
  coastline: number[][];
  buoys: EcdisBuoy[];
  route: EcdisRoutePoint[];
  ship: ShipState;
  ownShipVisualScale: number;
  aisTargets?: EcdisAisTarget[];
}

export function drawEcdisScene({
  scene,
  renderer,
  camera,
  center,
  scale,
  coastline,
  buoys,
  route,
  ship,
  ownShipVisualScale,
  aisTargets,
}: DrawEcdisSceneArgs) {
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

  const routeLine = route.map(wp => {
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

  route.forEach(wp => {
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

  const hullLen = 38 * ownShipVisualScale;
  const hullHalfBeam = 3.4 * ownShipVisualScale;
  const sternRound = 5.2 * ownShipVisualScale;
  const bowPoint = 8 * ownShipVisualScale;
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-hullHalfBeam, -hullLen / 2 + sternRound);
  hullShape.absarc(0, -hullLen / 2 + sternRound, sternRound, Math.PI, 0, false);
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
    7 * ownShipVisualScale,
    0,
  );

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

  const cogOffsetDeg = 7;
  const cogVectorDeg = ship.heading + cogOffsetDeg;
  const cogLen = 190 * ownShipVisualScale;
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
    -8 * ownShipVisualScale,
    -3 * ownShipVisualScale,
  );
  const arrowRight = worldFromShip(
    cogEnd.x,
    cogEnd.y,
    cogVectorDeg,
    -8 * ownShipVisualScale,
    3 * ownShipVisualScale,
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
    const along = i * 12 * ownShipVisualScale;
    const major = i % 4 === 0;
    const tickHalf = (major ? 2.6 : 1.4) * ownShipVisualScale;
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

  const beamLeft = worldFromShip(
    navPoint.x,
    navPoint.y,
    ship.heading,
    0,
    -18 * ownShipVisualScale,
  );
  const beamRight = worldFromShip(
    navPoint.x,
    navPoint.y,
    ship.heading,
    0,
    18 * ownShipVisualScale,
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

  const pastLen = 130 * ownShipVisualScale;
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
    const along = -i * 10 * ownShipVisualScale;
    const major = i % 4 === 0;
    const tickHalf = (major ? 2.8 : 1.6) * ownShipVisualScale;
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
}
