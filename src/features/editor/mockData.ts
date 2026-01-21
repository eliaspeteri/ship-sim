import { EditorLayer, EditorPack } from './types';

export const editorPacks: EditorPack[] = [
  {
    id: 'pack-hampton-roads',
    name: 'Hampton Roads Access',
    description: 'Harbor approaches, navigation aids, and berth metadata.',
    regionSummary: 'Virginia, USA',
    visibility: 'draft',
    updatedAt: '2025-02-10T16:20:00Z',
  },
  {
    id: 'pack-rotterdam-harbor',
    name: 'Port of Rotterdam',
    description: 'Berths, clearance zones, and speed limits.',
    regionSummary: 'Netherlands',
    visibility: 'published',
    updatedAt: '2025-01-28T09:12:00Z',
  },
  {
    id: 'pack-sf-bay',
    name: 'San Francisco Bay',
    description: 'Buoys, beacons, and restricted zones.',
    regionSummary: 'California, USA',
    visibility: 'draft',
    updatedAt: '2025-02-07T21:45:00Z',
  },
];

export const editorLayers: EditorLayer[] = [
  {
    id: 'layer-nav-aids',
    name: 'Navigation Aids',
    type: 'NavAidLayer',
    geometry: 'point',
    isVisible: true,
    isLocked: false,
  },
  {
    id: 'layer-speed-zones',
    name: 'Speed Zones',
    type: 'SpeedZoneLayer',
    geometry: 'polygon',
    isVisible: true,
    isLocked: false,
  },
  {
    id: 'layer-berths',
    name: 'Berths',
    type: 'BerthLayer',
    geometry: 'polyline',
    isVisible: false,
    isLocked: true,
  },
];
