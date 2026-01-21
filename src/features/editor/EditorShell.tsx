import React from 'react';
import { EditorLayer, EditorPack } from './types';
import { TOOL_DEFS, ToolId } from './editorTools';
import EditorBottomBar from './components/EditorBottomBar';
import EditorInspectorPanel from './components/EditorInspectorPanel';
import EditorToolsPanel from './components/EditorToolsPanel';
import EditorViewport from './components/EditorViewport';

type EditorShellProps = {
  pack: EditorPack;
  layers: EditorLayer[];
};

const EditorShell: React.FC<EditorShellProps> = ({ pack, layers }) => {
  const [activeTool, setActiveTool] = React.useState<ToolId>('select');
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const [layersOpen, setLayersOpen] = React.useState(true);

  const handleSelectTool = (toolId: ToolId) => {
    setActiveTool(toolId);
  };

  React.useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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
        <EditorViewport />
        <EditorBottomBar pack={pack} />
        <EditorToolsPanel
          tools={TOOL_DEFS}
          activeTool={activeTool}
          isOpen={leftOpen}
          onToggle={() => setLeftOpen(open => !open)}
          onSelectTool={handleSelectTool}
        />
        <EditorInspectorPanel
          layers={layers}
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
