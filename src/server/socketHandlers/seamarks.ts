import { bboxAroundLatLonGeodesic, querySeamarksBBox } from '../seamarks';
import type { SocketHandlerContext } from './context';

export function registerSeamarksHandler({ socket }: SocketHandlerContext) {
  socket.on('seamarks:nearby', data => {
    const lat = Number(data.lat);
    const lon = Number(data.lon);
    const radiusMeters = Number(data.radiusMeters);
    const limit = Number(data.limit ?? 5000);

    if (![lat, lon, radiusMeters].every(Number.isFinite)) return;

    const bbox = bboxAroundLatLonGeodesic({
      lat,
      lon,
      radiusMeters,
      corner: true,
    });

    const features = querySeamarksBBox({
      ...bbox,
      limit: Number.isFinite(limit) ? limit : 5000,
    });

    socket.emit('seamarks:data', {
      type: 'FeatureCollection',
      features,
      meta: { lat, lon, radiusMeters, bbox },
    });
  });
}
