import {
  applyWeatherPattern,
  getWeatherByCoordinates,
  getWeatherPattern,
} from '../weatherSystem';
import type { SocketHandlerContext } from './context';

export function registerAdminWeatherHandler({
  io,
  socket,
  hasAdminRole,
  getSpaceIdForSocket,
  isSpaceHost,
  weather,
  getEnvironmentForSpace,
  currentUtcTimeOfDay,
  weatherAutoIntervalMs,
  persistEnvironmentToDb,
  globalState,
}: SocketHandlerContext) {
  socket.on('admin:weather', async data => {
    const spaceId = getSpaceIdForSocket(socket);
    const isHost = await isSpaceHost(socket.data.userId, spaceId);
    if (!hasAdminRole(socket) && !isHost) {
      socket.emit('error', 'Not authorized to change weather');
      return;
    }

    const mode = data.mode === 'auto' ? 'auto' : 'manual';

    if (mode === 'auto') {
      weather.setMode('auto');
      weather.setTarget(null);
      const pattern = getWeatherPattern();
      pattern.timeOfDay = currentUtcTimeOfDay();
      const env = applyWeatherPattern(spaceId, pattern, globalState);
      weather.setNextAuto(Date.now() + weatherAutoIntervalMs);
      io.to(`space:${spaceId}`).emit('environment:update', env);
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Weather set to auto by ${socket.data.username}; next change at ${new Date(weather.getNextAuto()).toISOString()}`,
      );
      return;
    }

    weather.setMode('manual');
    if (typeof data.pattern === 'string' && data.pattern.length > 0) {
      const nextPattern = getWeatherPattern(data.pattern);
      const env = applyWeatherPattern(spaceId, nextPattern, globalState);
      weather.setTarget(nextPattern);
      io.to(`space:${spaceId}`).emit('environment:update', env);
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Weather preset '${data.pattern}' applied by ${socket.data.username}`,
      );
    } else if (data.coordinates) {
      const nextPattern = getWeatherByCoordinates(
        data.coordinates.lat,
        data.coordinates.lng,
      );
      const env = applyWeatherPattern(spaceId, nextPattern, globalState);
      weather.setTarget(nextPattern);
      io.to(`space:${spaceId}`).emit('environment:update', env);
      void persistEnvironmentToDb({ force: true, spaceId });
      console.info(
        `Weather from coordinates applied by ${socket.data.username} (${data.coordinates.lat}, ${data.coordinates.lng})`,
      );
    } else {
      io.to(`space:${spaceId}`).emit(
        'environment:update',
        getEnvironmentForSpace(spaceId),
      );
    }
  });
}
