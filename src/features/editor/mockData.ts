import { EditorLayer, EditorPack } from './types';

export const editorPacks: EditorPack[] = [
  {
    id: 'pack-hampton-roads',
    name: 'Hampton Roads Access',
    description: 'Harbor approaches, navigation aids, and berth metadata.',
    regionSummary: 'Virginia, USA',
    visibility: 'draft',
    updatedAt: '2025-02-10T16:20:00Z',
    workAreas: [
      {
        id: 'wa-hampton-roads',
        name: 'Harbor Approach',
        bounds: {
          type: 'bbox',
          minLat: 36.8,
          minLon: -76.5,
          maxLat: 37.2,
          maxLon: -76.1,
        },
        allowedZoom: [8, 14],
        sources: ['terrain', 'bathymetry', 'imagery'],
      },
    ],
  },
  {
    id: 'pack-rotterdam-harbor',
    name: 'Port of Rotterdam',
    description: 'Berths, clearance zones, and speed limits.',
    regionSummary: 'Netherlands',
    visibility: 'published',
    updatedAt: '2025-01-28T09:12:00Z',
    workAreas: [
      {
        id: 'wa-rotterdam',
        name: 'Maasvlakte',
        bounds: {
          type: 'bbox',
          minLat: 51.9,
          minLon: 4.0,
          maxLat: 52.1,
          maxLon: 4.4,
        },
        allowedZoom: [9, 15],
        sources: ['terrain', 'bathymetry'],
      },
    ],
  },
  {
    id: 'pack-sf-bay',
    name: 'San Francisco Bay',
    description: 'Buoys, beacons, and restricted zones.',
    regionSummary: 'California, USA',
    visibility: 'draft',
    updatedAt: '2025-02-07T21:45:00Z',
    workAreas: [
      {
        id: 'wa-sf-bay',
        name: 'Bay Core',
        bounds: {
          type: 'bbox',
          minLat: 37.6,
          minLon: -122.6,
          maxLat: 37.9,
          maxLon: -122.2,
        },
        allowedZoom: [8, 14],
        sources: ['terrain', 'bathymetry', 'imagery'],
      },
    ],
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
