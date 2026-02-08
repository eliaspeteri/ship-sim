import { VesselState } from '../../../types/vessel.types';

export type EcdisRoutePoint = { latitude: number; longitude: number };

export type EcdisAisTarget = {
  lat: number;
  lon: number;
  name: string;
  mmsi: string;
  heading: number;
  speed: number;
};

export type EcdisBuoy = {
  latitude: number;
  longitude: number;
  type: string;
};

export type EcdisChartData = {
  coastline: Array<[number, number]>;
  buoys: EcdisBuoy[];
};

export interface EcdisDisplayProps {
  shipPosition?: VesselState['position'];
  heading?: VesselState['orientation']['heading'];
  route?: EcdisRoutePoint[];
  aisTargets?: EcdisAisTarget[];
  chartData?: EcdisChartData;
}
