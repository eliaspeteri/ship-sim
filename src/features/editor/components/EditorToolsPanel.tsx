import React from 'react';
import type { ToolDef, ToolId } from '../editorTools';

type EditorToolsPanelProps = {
  tools: readonly ToolDef[];
  activeTool: ToolId;
  isOpen: boolean;
  onToggle: () => void;
  onSelectTool: (toolId: ToolId) => void;
};

const EditorToolsPanel: React.FC<EditorToolsPanelProps> = ({
  tools,
  activeTool,
  isOpen,
  onToggle,
  onSelectTool,
}) => {
  return (
    <aside
      className={`absolute top-3 left-3 box-border flex h-[clamp(280px,58vh,calc(100%_-_84px))] flex-col items-start gap-2.5 rounded-[14px] border border-editor-panel-border bg-editor-panel backdrop-blur-[12px] opacity-[0.88] ${
        isOpen
          ? 'w-[240px] max-[1100px]:w-[200px] p-2.5'
          : 'w-[52px] overflow-hidden p-1.5'
      }`}
    >
      <button
        type="button"
        className={`absolute box-border grid h-7 w-7 place-items-center rounded-[10px] border border-editor-control-border bg-editor-control-bg text-[14px] text-[#d9ebf4] cursor-pointer ${
          isOpen ? 'top-2 left-2' : 'top-1.5 left-1/2 -translate-x-1/2'
        }`}
        onClick={onToggle}
        aria-label={isOpen ? 'Collapse tools panel' : 'Expand tools panel'}
      >
        {isOpen ? '<' : '='}
      </button>
      <div className="box-border flex w-full flex-col gap-2.5 pt-9">
        {isOpen ? (
          <div className="text-[11px] uppercase tracking-[0.14em] text-editor-muted">
            Tools
          </div>
        ) : null}
        <div
          className={`grid w-full content-start justify-items-center ${
            isOpen ? 'grid-cols-3 gap-2.5' : 'grid-cols-1 gap-2'
          }`}
        >
          {tools.map(tool => (
            <button
              key={tool.id}
              type="button"
              className={`box-border inline-flex h-[30px] w-8 min-w-0 items-center justify-center gap-1 rounded-[10px] border border-editor-tool-border bg-editor-tool-bg text-[12px] text-[#e8f3f8] cursor-pointer ${
                activeTool === tool.id
                  ? 'border-editor-accent-ring shadow-editor-accent'
                  : ''
              }`}
              onClick={() => onSelectTool(tool.id)}
              title={tool.label}
              aria-pressed={activeTool === tool.id}
            >
              <span className="font-bold">{tool.icon}</span>
              <span className="text-[11px] text-editor-muted">{tool.key}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default EditorToolsPanel;
