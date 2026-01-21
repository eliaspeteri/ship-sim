import React from 'react';
import { EditorLayer } from '../types';

type EditorLayerListProps = {
  layers: EditorLayer[];
};

const EditorLayerList: React.FC<EditorLayerListProps> = ({ layers }) => {
  return (
    <div className="grid max-h-[240px] gap-2.5 overflow-auto pr-1">
      {layers.map(layer => (
        <div
          key={layer.id}
          className="box-border flex min-h-[56px] items-center justify-between rounded-[10px] border border-editor-row-border bg-editor-row-bg px-2.5 py-2"
        >
          <div>
            <div className="font-semibold">{layer.name}</div>
            <div className="text-[11px] text-editor-muted">
              {layer.type} • {layer.geometry}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="box-border h-[22px] min-w-[34px] rounded-full border border-editor-pill-border bg-editor-pill-bg px-2 py-1 text-[11px] text-[#d9ebf4]"
              aria-pressed={layer.isVisible}
            >
              {layer.isVisible ? 'Vis' : 'Hid'}
            </button>
            <button
              type="button"
              className="box-border h-[22px] min-w-[34px] rounded-full border border-editor-pill-border bg-editor-pill-bg px-2 py-1 text-[11px] text-[#d9ebf4]"
              aria-pressed={layer.isLocked}
            >
              {layer.isLocked ? 'Lock' : 'Free'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditorLayerList;
