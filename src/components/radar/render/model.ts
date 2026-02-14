/* global CanvasRenderingContext2D */
import type {
  AISTarget,
  EBL,
  GuardZone,
  RadarEnvironment,
  RadarSettings,
  RadarTarget,
  VRM,
} from '../types';
import type { ARPASettings, ARPATarget, OwnShipData } from '../arpa';

export interface RadarRenderModel {
  size: number;
  sweepAngle: number;
  settings: RadarSettings;
  environment: RadarEnvironment;
  targets: RadarTarget[];
  aisTargets: AISTarget[];
  arpaSettings: ARPASettings;
  arpaTargets: ARPATarget[];
  arpaEnabled: boolean;
  ownShip: OwnShipData;
  ebl: EBL;
  vrm: VRM;
  guardZone: GuardZone;
}

export interface RadarRenderContext {
  ctx: CanvasRenderingContext2D;
  radius: number;
  radarRadius: number;
  rotationAngle: number;
}
