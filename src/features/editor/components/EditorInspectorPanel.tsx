import React from 'react';
import { EditorLayer } from '../types';
import EditorLayerList from './EditorLayerList';

type EditorInspectorPanelProps = {
  layers: EditorLayer[];
  isOpen: boolean;
  layersOpen: boolean;
  onToggle: () => void;
  onToggleLayers: () => void;
};

const EditorInspectorPanel: React.FC<EditorInspectorPanelProps> = ({
  layers,
  isOpen,
  layersOpen,
  onToggle,
  onToggleLayers,
}) => {
  return (
    <aside
      className={`absolute top-3 right-3 box-border flex h-[clamp(280px,58vh,calc(100%_-_84px))] flex-col items-start gap-2.5 rounded-[14px] border border-editor-panel-border bg-editor-panel backdrop-blur-[12px] opacity-[0.88] ${
        isOpen
          ? 'w-[240px] max-[1100px]:w-[200px] p-2.5'
          : 'w-[52px] overflow-hidden p-1.5'
      }`}
    >
      <button
        type="button"
        className={`absolute box-border grid h-7 w-7 place-items-center rounded-[10px] border border-editor-control-border bg-editor-control-bg text-[14px] text-[#d9ebf4] cursor-pointer ${
          isOpen ? 'top-2 right-2' : 'top-1.5 left-1/2 -translate-x-1/2'
        }`}
        onClick={onToggle}
        aria-label={
          isOpen ? 'Collapse inspector panel' : 'Expand inspector panel'
        }
      >
        {isOpen ? '>' : '='}
      </button>
      <div className="box-border flex w-full flex-col gap-2.5 pt-9">
        {isOpen ? (
          <>
            <div className="text-[11px] uppercase tracking-[0.14em] text-editor-muted">
              Inspector
            </div>
            <div className="box-border min-h-[72px] rounded-[12px] border border-editor-inspector-border bg-editor-inspector-bg p-3">
              <div className="mb-1.5 font-semibold">Layer Details</div>
              <div className="text-[13px] text-editor-muted">
                Select a layer or feature
              </div>
            </div>
            <button
              type="button"
              className="flex w-full min-h-[32px] items-center justify-between rounded-[10px] border border-editor-quiet-border bg-editor-quiet-bg cursor-pointer"
              onClick={onToggleLayers}
              aria-label={
                layersOpen ? 'Collapse layers list' : 'Expand layers list'
              }
            >
              <span className="text-[11px] uppercase tracking-[0.14em] text-editor-muted">
                Layers
              </span>
              <span className="grid h-[22px] w-[22px] place-items-center rounded-[8px] border border-editor-control-border bg-editor-control-bg text-[#d9ebf4]">
                {layersOpen ? 'v' : '>'}
              </span>
            </button>
            {layersOpen ? <EditorLayerList layers={layers} /> : null}
          </>
        ) : null}
      </div>
    </aside>
  );
};

export default EditorInspectorPanel;
