import React from 'react';
import { useRouter } from 'next/router';
import type { EditorLayer, EditorPack, EditorWorkArea } from './types';
import type { ToolId } from './editorTools';
import { TOOL_DEFS } from './editorTools';
import EditorBottomBar from './components/EditorBottomBar';
import EditorInspectorPanel from './components/EditorInspectorPanel';
import EditorToolsPanel from './components/EditorToolsPanel';
import EditorViewport from './components/EditorViewport';
import {
  compileOverlayDraft,
  compileOverlayServer,
} from './services/overlayCompilation';
import {
  clearOverlayCache,
  getWorkAreaTiles,
} from './services/overlayStreaming';

type EditorShellProps = {
  pack: EditorPack;
  layers: EditorLayer[];
};

const EditorShell: React.FC<EditorShellProps> = ({ pack, layers }) => {
  const router = useRouter();
  const [activeTool, setActiveTool] = React.useState<ToolId>('select');
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const [layersOpen, setLayersOpen] = React.useState(true);
  const [workAreas, setWorkAreas] = React.useState<EditorWorkArea[]>(
    pack.workAreas ?? [],
  );
  const [focusRequest, setFocusRequest] = React.useState<{
    lat: number;
    lon: number;
    token: number;
    distanceMeters?: number;
  } | null>(null);
  const focusTokenRef = React.useRef(0);
  const [compileSummary, setCompileSummary] = React.useState('Compile: idle');
  const [layerState, setLayerState] = React.useState<EditorLayer[]>(layers);
  const layerIds = React.useMemo(
    () => layerState.map(layer => layer.id),
    [layerState],
  );

  React.useEffect(() => {
    setLayerState(layers);
  }, [layers]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = `editorWorkAreas:${pack.id}`;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as EditorWorkArea[];
        setWorkAreas(parsed);
        return;
      } catch (error) {
        console.warn('Failed to parse saved work areas', error);
      }
    }
    setWorkAreas(pack.workAreas ?? []);
  }, [pack.id, pack.workAreas]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = `editorWorkAreas:${pack.id}`;
    window.localStorage.setItem(storageKey, JSON.stringify(workAreas));
  }, [pack.id, workAreas]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const timeout = window.setTimeout(() => {
      void fetch(`/api/editor/packs/${pack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workAreas }),
      }).catch(error => {
        console.warn('Failed to persist work areas', error);
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [pack.id, workAreas]);

  React.useEffect(() => {
    const tiles = getWorkAreaTiles(workAreas);
    if (tiles.length === 0 || layerIds.length === 0) {
      setCompileSummary('Compile: idle');
      return;
    }
    let cancelled = false;
    setCompileSummary('Compile: running');
    void compileOverlayDraft({
      packId: pack.id,
      layerIds,
      tiles,
    })
      .then(result => {
        if (cancelled) return;
        setCompileSummary(`Compile: ${result.artifacts.length} artifacts`);
      })
      .catch(() => {
        if (cancelled) return;
        setCompileSummary('Compile: error');
      });
    return () => {
      cancelled = true;
    };
  }, [layerIds, pack.id, workAreas]);

  React.useEffect(() => {
    clearOverlayCache();
  }, [pack.id]);

  const handleSelectTool = (toolId: ToolId) => {
    setActiveTool(toolId);
  };

  const handleFocusWorkArea = React.useCallback(
    (lat: number, lon: number, radiusMeters: number) => {
      focusTokenRef.current += 1;
      setFocusRequest({
        lat,
        lon,
        token: focusTokenRef.current,
        distanceMeters: Math.max(100, radiusMeters * 2),
      });
    },
    [],
  );

  const handleMoveLayer = React.useCallback(
    (layerId: string, direction: 'up' | 'down') => {
      setLayerState(prev => {
        const currentIndex = prev.findIndex(layer => layer.id === layerId);
        if (currentIndex < 0) return prev;
        const nextIndex =
          direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0 || nextIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(nextIndex, 0, moved);
        return next;
      });
    },
    [],
  );

  const handleToggleLayerVisibility = React.useCallback((layerId: string) => {
    setLayerState(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, isVisible: !layer.isVisible }
          : layer,
      ),
    );
  }, []);

  const handleToggleLayerLock = React.useCallback((layerId: string) => {
    setLayerState(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, isLocked: !layer.isLocked } : layer,
      ),
    );
  }, []);

  const handlePublish = async () => {
    const tiles = getWorkAreaTiles(workAreas);
    if (tiles.length === 0 || layerIds.length === 0) {
      setCompileSummary('Publish: no tiles');
      return;
    }
    setCompileSummary('Publish: compiling');
    try {
      const result = await compileOverlayServer({
        packId: pack.id,
        layerIds,
        tiles,
      });
      setCompileSummary(`Publish: ${result.artifactCount} artifacts`);
      clearOverlayCache();
      const statusRes = await fetch(`/api/editor/packs/${pack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      if (!statusRes.ok) {
        throw new Error(`Status update failed: ${statusRes.status}`);
      }
      setCompileSummary('Publish: complete');
      await router.push(
        `/editor/packs?published=${encodeURIComponent(pack.id)}`,
      );
    } catch (error) {
      console.error('Publish compile failed', error);
      setCompileSummary('Publish: error');
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active instanceof globalThis.HTMLInputElement ||
        active instanceof globalThis.HTMLTextAreaElement ||
        active instanceof globalThis.HTMLSelectElement ||
        active?.getAttribute?.('contenteditable') === 'true'
      ) {
        return;
      }
      if (event.repeat) return;
      const tool = TOOL_DEFS.find(def => def.key === event.key);
      if (tool) {
        setActiveTool(tool.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="grid h-[calc(100vh-var(--nav-height))] min-h-[calc(100vh-var(--nav-height))] overflow-hidden bg-editor-shell text-editor-text">
      <div className="relative h-full min-h-0 overflow-hidden">
        <EditorViewport
          packId={pack.id}
          layerIds={layerIds}
          workAreas={workAreas}
          focusRequest={focusRequest}
        />
        <EditorBottomBar
          pack={pack}
          compileSummary={compileSummary}
          onPublish={handlePublish}
        />
        <EditorToolsPanel
          tools={TOOL_DEFS}
          activeTool={activeTool}
          isOpen={leftOpen}
          onToggle={() => setLeftOpen(open => !open)}
          onSelectTool={handleSelectTool}
        />
        <EditorInspectorPanel
          layers={layerState}
          workAreas={workAreas}
          onWorkAreasChange={setWorkAreas}
          onFocusWorkArea={handleFocusWorkArea}
          onMoveLayer={handleMoveLayer}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleLayerLock={handleToggleLayerLock}
          isOpen={rightOpen}
          layersOpen={layersOpen}
          onToggle={() => setRightOpen(open => !open)}
          onToggleLayers={() => setLayersOpen(open => !open)}
        />
      </div>
    </div>
  );
};

export default EditorShell;
