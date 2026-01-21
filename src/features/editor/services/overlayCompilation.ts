import { OverlayTileKey } from './overlayStreaming';

export type CompilationInput = {
  packId: string;
  layerIds: string[];
  tiles: OverlayTileKey[];
};

export type CompilationArtifact = {
  tile: OverlayTileKey;
  layerId: string;
  lod: number;
  bytes: ArrayBuffer;
};

export type CompilationResult = {
  artifacts: CompilationArtifact[];
  generatedAt: string;
};

export type ServerCompileResult = {
  artifactCount: number;
  storedAt: string;
};

export const compileOverlayDraft = async (
  input: CompilationInput,
): Promise<CompilationResult> => {
  // Placeholder: stub to unblock editor preview wiring.
  return {
    artifacts: input.tiles.flatMap(tile =>
      input.layerIds.map(layerId => ({
        tile,
        layerId,
        lod: tile.z,
        bytes: new ArrayBuffer(0),
      })),
    ),
    generatedAt: new Date().toISOString(),
  };
};

export const compileOverlayServer = async (
  input: CompilationInput,
): Promise<ServerCompileResult> => {
  const res = await fetch('/api/editor/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Compile request failed: ${res.status}`);
  }
  return (await res.json()) as ServerCompileResult;
};
