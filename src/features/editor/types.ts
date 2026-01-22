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

export type EditorWorkArea = {
  id: string;
  name: string;
  bounds:
    | {
        type: 'bbox';
        minLat: number;
        minLon: number;
        maxLat: number;
        maxLon: number;
      }
    | {
        type: 'polygon';
        coordinates: Array<[number, number]>;
      };
  allowedZoom: [number, number];
  sources: string[];
};
