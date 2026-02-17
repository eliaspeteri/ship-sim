/* global CanvasRenderingContext2D */
import { ARPATargetStatus, getTargetStatus, getVectorEndpoint } from '../arpa';
import { calculateTargetVisibility, polarToCartesian } from '../utils';

import type { RadarTarget, GuardZone } from '../types';
import type { RadarRenderContext, RadarRenderModel } from './model';

export function isTargetInGuardZone(
  guardZone: GuardZone,
  target: Pick<RadarTarget, 'bearing' | 'distance'>,
): boolean {
  if (!guardZone.active) return false;

  let start = guardZone.startAngle % 360;
  let end = guardZone.endAngle % 360;
  let bearing = target.bearing % 360;

  if (start < 0) start += 360;
  if (end < 0) end += 360;
  if (bearing < 0) bearing += 360;

  const inAngleRange =
    start < end
      ? bearing >= start && bearing <= end
      : bearing >= start || bearing <= end;
  const inDistanceRange =
    target.distance >= guardZone.innerRange &&
    target.distance <= guardZone.outerRange;

  return inAngleRange && inDistanceRange;
}

export function getArpaTargetColor(status: ARPATargetStatus): string {
  switch (status) {
    case ARPATargetStatus.DANGEROUS:
      return '#FF3333';
    case ARPATargetStatus.LOST:
      return '#888888';
    case ARPATargetStatus.ACQUIRING:
      return '#FFAA33';
    default:
      return '#55FF55';
  }
}

function drawAisTargets(
  renderContext: RadarRenderContext,
  model: RadarRenderModel,
): void {
  const { ctx, rotationAngle, radarRadius } = renderContext;
  const { settings, aisTargets } = model;

  for (const target of aisTargets) {
    if (target.distance > settings.range) continue;

    const { x, y } = polarToCartesian(
      target.distance,
      (target.bearing - rotationAngle + 360) % 360,
      settings.range,
      radarRadius,
    );

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(
      (((target.heading ?? target.course) - rotationAngle) * Math.PI) / 180,
    );
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fillStyle = settings.nightMode ? '#3AB7FF' : '#2563EB';
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    ctx.restore();
  }
}

type TrackedOverlayInput = {
  x: number;
  y: number;
  targetSize: number;
  visibility: number;
  targetId: string;
  rotationAngle: number;
  settingsRange: number;
  radarRadius: number;
};

function drawTrackedTargetOverlays(
  ctx: CanvasRenderingContext2D,
  model: RadarRenderModel,
  input: TrackedOverlayInput,
): void {
  const arpaTarget = model.arpaTargets.find(item => item.id === input.targetId);
  if (!arpaTarget) return;

  const status = getTargetStatus(arpaTarget, model.arpaSettings);
  const color = getArpaTargetColor(status);

  if (status !== ARPATargetStatus.ACQUIRING) {
    const vectorEndpoint = getVectorEndpoint(
      arpaTarget,
      model.arpaSettings,
      model.ownShip,
    );
    const { x: vectorX, y: vectorY } = polarToCartesian(
      vectorEndpoint.distance,
      (vectorEndpoint.bearing - input.rotationAngle + 360) % 360,
      input.settingsRange,
      input.radarRadius,
    );

    ctx.beginPath();
    ctx.moveTo(input.x, input.y);
    ctx.lineTo(vectorX, vectorY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.rect(
    input.x - input.targetSize * 1.5,
    input.y - input.targetSize * 1.5,
    input.targetSize * 3,
    input.targetSize * 3,
  );
  ctx.strokeStyle = color;
  ctx.lineWidth = status === ARPATargetStatus.DANGEROUS ? 2 : 1;
  ctx.stroke();

  if (status === ARPATargetStatus.DANGEROUS) {
    ctx.beginPath();
    ctx.arc(input.x, input.y, input.targetSize * 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF3333';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const historyPoints = arpaTarget.historicalPositions;
  if (historyPoints.length <= 1 || status === ARPATargetStatus.ACQUIRING) {
    return;
  }

  const maxPoints = Math.min(
    model.arpaSettings.historyPointsCount,
    historyPoints.length,
  );
  for (let index = 1; index < maxPoints; index += 1) {
    const historyIndex = historyPoints.length - 1 - index;
    if (historyIndex < 0) break;
    const history = historyPoints[historyIndex];
    const { x: historyX, y: historyY } = polarToCartesian(
      history.distance,
      (history.bearing - input.rotationAngle + 360) % 360,
      input.settingsRange,
      input.radarRadius,
    );

    ctx.beginPath();
    ctx.arc(historyX, historyY, input.targetSize * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0.2, 1 - index * 0.2);
    ctx.fill();
  }

  ctx.globalAlpha = input.visibility;
}

export function drawRadarTargets(
  renderContext: RadarRenderContext,
  model: RadarRenderModel,
): void {
  const { ctx, rotationAngle, radarRadius } = renderContext;
  const { settings, environment, guardZone, targets, arpaEnabled } = model;

  for (const target of targets) {
    if (target.distance > settings.range) continue;

    const visibility = calculateTargetVisibility(
      target,
      settings.band,
      settings.gain,
      settings.seaClutter,
      settings.rainClutter,
      environment,
    );
    if (visibility <= 0) continue;

    const { x, y } = polarToCartesian(
      target.distance,
      (target.bearing - rotationAngle + 360) % 360,
      settings.range,
      radarRadius,
    );

    const targetSize = 3 + target.size * 4;
    ctx.globalAlpha = visibility;

    if (isTargetInGuardZone(guardZone, target)) {
      ctx.beginPath();
      ctx.arc(x, y, targetSize * 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (target.type === 'land') {
      ctx.fillStyle = settings.nightMode ? '#AAF7' : '#AFA7';
      ctx.beginPath();
      ctx.arc(x, y, targetSize * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      continue;
    }

    ctx.fillStyle = '#5F5';
    ctx.beginPath();
    ctx.arc(x, y, targetSize, 0, Math.PI * 2);
    ctx.fill();

    if (target.isTracked && arpaEnabled) {
      drawTrackedTargetOverlays(ctx, model, {
        x,
        y,
        targetSize,
        visibility,
        targetId: target.id,
        rotationAngle,
        settingsRange: settings.range,
        radarRadius,
      });
    }

    ctx.globalAlpha = 1.0;
  }

  drawAisTargets(renderContext, model);
}
