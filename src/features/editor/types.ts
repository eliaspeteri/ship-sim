export type EditorPack = {
  id: string;
  name: string;
  description: string;
  regionSummary?: string;
  visibility: 'draft' | 'published' | 'curated';
  updatedAt: string;
};

export type EditorLayer = {
  id: string;
  name: string;
  type: string;
  geometry: 'point' | 'polyline' | 'polygon' | 'raster' | 'volume' | 'instance';
  isVisible: boolean;
  isLocked: boolean;
};
