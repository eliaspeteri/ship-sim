/* global CanvasRenderingContext2D */
import { drawRadarBackground } from './background';
import { drawRadarOverlays } from './overlays';
import { drawRadarTargets } from './targets';

import type { RadarRenderContext, RadarRenderModel } from './model';

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
