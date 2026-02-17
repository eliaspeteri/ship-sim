import { getRainClutterStrength, getSeaClutterStrength } from '../utils';

import type { RadarRenderContext, RadarRenderModel } from './model';

export function drawRadarOverlays(
  renderContext: RadarRenderContext,
  model: RadarRenderModel,
): void {
  drawSweepLine(renderContext, model);
  drawSeaClutter(renderContext, model);
  drawRainClutter(renderContext, model);
  drawRangeRings(renderContext, model);
  drawGuardZoneOverlay(renderContext, model);
  drawEblOverlay(renderContext, model);
  drawVrmOverlay(renderContext, model);
}

function drawSweepLine(
  { ctx, radius, radarRadius }: RadarRenderContext,
  { sweepAngle }: RadarRenderModel,
): void {
  ctx.beginPath();
  ctx.moveTo(radius, radius);
  const sweepRad = (sweepAngle * Math.PI) / 180;
  ctx.lineTo(
    radius + Math.sin(sweepRad) * radarRadius,
    radius - Math.cos(sweepRad) * radarRadius,
  );
  ctx.strokeStyle = 'rgba(85, 255, 85, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSeaClutter(
  { ctx, radius, radarRadius }: RadarRenderContext,
  { settings, environment }: RadarRenderModel,
): void {
  if (environment.seaState <= 0) return;

  const gradient = ctx.createRadialGradient(
    radius,
    radius,
    0,
    radius,
    radius,
    radarRadius * 0.6,
  );
  const clutterColor = '0, 255, 85';
  gradient.addColorStop(
    0,
    `rgba(${clutterColor}, ${getSeaClutterStrength(0, settings.range, environment.seaState, settings.seaClutter)})`,
  );
  gradient.addColorStop(
    0.3,
    `rgba(${clutterColor}, ${getSeaClutterStrength(settings.range * 0.3, settings.range, environment.seaState, settings.seaClutter)})`,
  );
  gradient.addColorStop(1, `rgba(${clutterColor}, 0)`);

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(radius, radius, radarRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;
}

function drawRainClutter(
  { ctx, radius, radarRadius }: RadarRenderContext,
  { settings, environment }: RadarRenderModel,
): void {
  if (environment.rainIntensity <= 0) return;

  const clutterStrength = getRainClutterStrength(
    settings.band,
    environment.rainIntensity,
    settings.rainClutter,
  );
  if (clutterStrength <= 0) return;

  ctx.fillStyle = 'rgba(85, 255, 85, 0.5)';
  ctx.globalAlpha = clutterStrength * 0.3;

  const speckles = Math.floor(clutterStrength * 500);
  for (let index = 0; index < speckles; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radarRadius;
    const x = radius + Math.cos(angle) * distance;
    const y = radius + Math.sin(angle) * distance;

    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
}

function drawRangeRings(
  { ctx, radius, radarRadius }: RadarRenderContext,
  { settings }: RadarRenderModel,
): void {
  ctx.save();
  ctx.strokeStyle = settings.nightMode
    ? 'rgba(85, 255, 85, 0.35)'
    : 'rgba(85, 255, 85, 0.25)';
  ctx.lineWidth = 1;

  const rings = 5;
  for (let index = 1; index <= rings; index += 1) {
    const ringRadius = radarRadius * (index / rings);
    ctx.beginPath();
    ctx.arc(radius, radius, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGuardZoneOverlay(
  { ctx, radius, radarRadius, rotationAngle }: RadarRenderContext,
  { guardZone, settings }: RadarRenderModel,
): void {
  if (!guardZone.active) return;

  const innerRadius = (guardZone.innerRange / settings.range) * radarRadius;
  const outerRadius = (guardZone.outerRange / settings.range) * radarRadius;
  const startAngle =
    ((guardZone.startAngle - rotationAngle + 360) % 360) * (Math.PI / 180);
  const endAngle =
    ((guardZone.endAngle - rotationAngle + 360) % 360) * (Math.PI / 180);

  ctx.save();
  ctx.beginPath();
  ctx.arc(radius, radius, outerRadius, startAngle, endAngle);
  ctx.lineTo(
    radius + Math.cos(endAngle) * innerRadius,
    radius + Math.sin(endAngle) * innerRadius,
  );
  ctx.arc(radius, radius, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawEblOverlay(
  { ctx, radius, radarRadius, rotationAngle }: RadarRenderContext,
  { ebl }: RadarRenderModel,
): void {
  if (!ebl.active) return;

  const angleRad = ((ebl.angle - rotationAngle + 360) % 360) * (Math.PI / 180);
  const endX = radius + Math.sin(angleRad) * radarRadius;
  const endY = radius - Math.cos(angleRad) * radarRadius;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, radius);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#55FF55';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(endX, endY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#55FF55';
  ctx.fill();
  ctx.restore();
}

function drawVrmOverlay(
  { ctx, radius, radarRadius }: RadarRenderContext,
  { vrm, settings }: RadarRenderModel,
): void {
  if (!vrm.active) return;

  const vrmRadius = (vrm.distance / settings.range) * radarRadius;

  ctx.save();
  ctx.beginPath();
  ctx.arc(radius, radius, vrmRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#55FF55';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();
}
