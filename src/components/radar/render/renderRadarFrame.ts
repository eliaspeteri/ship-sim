/* global CanvasRenderingContext2D */
import type { RadarRenderContext, RadarRenderModel } from './model';
import { drawRadarBackground } from './background';
import { drawRadarTargets } from './targets';
import { drawRadarOverlays } from './overlays';

function getRotationAngle(model: RadarRenderModel): number {
  if (model.settings.orientation === 'head-up') {
    return model.ownShip.heading ?? 0;
  }
  if (model.settings.orientation === 'course-up') {
    return model.ownShip.course ?? 0;
  }
  return 0;
}

export function renderRadarFrame(
  ctx: CanvasRenderingContext2D,
  model: RadarRenderModel,
): void {
  const radius = model.size / 2;
  const radarRadius = radius - 2;

  const renderContext: RadarRenderContext = {
    ctx,
    radius,
    radarRadius,
    rotationAngle: getRotationAngle(model),
  };

  drawRadarBackground(renderContext, model);
  drawRadarTargets(renderContext, model);
  drawRadarOverlays(renderContext, model);
}
