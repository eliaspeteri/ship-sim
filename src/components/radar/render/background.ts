import { generateNoisePattern, generateRadarNoise } from '../utils';

import type { RadarRenderContext, RadarRenderModel } from './model';

export function drawRadarBackground(
  renderContext: RadarRenderContext,
  model: RadarRenderModel,
): void {
  const { ctx, radius, radarRadius } = renderContext;
  const { size, settings, environment } = model;

  ctx.fillStyle = settings.nightMode
    ? 'rgba(0, 10, 20, 0.15)'
    : 'rgba(0, 20, 10, 0.15)';
  ctx.fillRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(radius, radius, radarRadius, 0, Math.PI * 2);
  ctx.fillStyle = settings.nightMode ? '#000B14' : '#001A14';
  ctx.fill();

  const noiseLevel = generateRadarNoise(
    settings.band,
    environment,
    settings.gain,
  );
  const noisePattern = generateNoisePattern(size, size, noiseLevel);

  ctx.globalAlpha = 0.2;
  ctx.putImageData(noisePattern, 0, 0);
  ctx.globalAlpha = 1.0;
}
