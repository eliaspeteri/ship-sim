export type EditorPack = {
  id: string;
  slug?: string;
  ownerId?: string;
  name: string;
  description: string;
  regionSummary?: string;
  visibility: 'draft' | 'published' | 'curated';
  status?: 'draft' | 'submitted' | 'published';
  submitForReview?: boolean;
  updatedAt: string;
  workAreas?: EditorWorkArea[];
};

export type EditorLayer = {
  id: string;
  name: string;
  type: string;
  geometry: 'point' | 'polyline' | 'polygon' | 'raster' | 'volume' | 'instance';
  isVisible: boolean;
  isLocked: boolean;
};

export type PolygonBounds = {
  type: 'polygon';
  coordinates: Array<[number, number]>;
};

export const isPolygonBounds = (
  bounds: PolygonBounds | BBoxBounds,
): bounds is PolygonBounds => {
  return bounds.type === 'polygon';
};

export type BBoxBounds = {
  type: 'bbox';
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

export const isBBoxBounds = (
  bounds: PolygonBounds | BBoxBounds,
): bounds is BBoxBounds => {
  return bounds.type === 'bbox';
};

export type EditorWorkArea = {
  id: string;
  name: string;
  isLocked?: boolean;
  bounds: PolygonBounds | BBoxBounds;
  allowedZoom: [number, number];
  sources: string[];
};
