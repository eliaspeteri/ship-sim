import type { EcdisBuoy, EcdisRoutePoint } from './types';

export const mockCoastline: Array<[number, number]> = [
  [24.93, 60.16],
  [24.95, 60.17],
  [24.97, 60.18],
  [24.99, 60.17],
  [25.01, 60.16],
  [24.99, 60.15],
  [24.97, 60.14],
  [24.95, 60.15],
  [24.93, 60.16],
];

export const mockBuoys: EcdisBuoy[] = [
  { latitude: 60.165, longitude: 24.96, type: 'starboard' },
  { latitude: 60.175, longitude: 24.98, type: 'port' },
];

export const mockRoute: EcdisRoutePoint[] = [
  { latitude: 60.162, longitude: 24.94 },
  { latitude: 60.168, longitude: 24.96 },
  { latitude: 60.174, longitude: 24.98 },
  { latitude: 60.178, longitude: 25.0 },
];
