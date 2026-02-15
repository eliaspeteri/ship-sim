import React from 'react';
import Link from 'next/link';
import type { EditorPack } from '../types';

type EditorBottomBarProps = {
  pack: EditorPack;
  compileSummary?: string;
  onPublish?: () => void;
};

const EditorBottomBar: React.FC<EditorBottomBarProps> = ({
  pack,
  compileSummary = 'Compile: idle',
  onPublish,
}) => {
  return (
    <header className="absolute bottom-3 left-3 right-3 z-[3] box-border flex h-[52px] items-center justify-between rounded-[12px] border border-editor-panel-border bg-editor-bottom-bar px-3 py-2 backdrop-blur-[8px]">
      <div className="flex items-center gap-3">
        <Link
          href="/editor/packs"
          className="inline-flex items-center gap-2 rounded-full border border-editor-panel-border bg-editor-quiet-bg px-3 py-1 text-[12px] font-semibold text-editor-link"
        >
          <span aria-hidden="true">{'<-'}</span>
          Back to packs
        </Link>
        <div className="flex items-center gap-2.5 leading-none">
          <div className="hidden text-[10px] uppercase tracking-[0.18em] text-editor-muted">
            Pack
          </div>
          <div className="text-sm font-semibold whitespace-nowrap">
            {pack.name}
          </div>
          <div className="text-xs text-editor-muted whitespace-nowrap">
            {pack.regionSummary}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="rounded-full border border-editor-accent-border bg-editor-accent-soft px-3 py-1.5 text-[12px] text-editor-status-text">
          {compileSummary}
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-full border border-transparent bg-editor-accent-gradient px-3.5 py-1.5 text-[12px] font-semibold text-editor-accent-text"
          onClick={onPublish}
          title="Compile and publish overlay artifacts"
        >
          Publish
        </button>
      </div>
    </header>
  );
};

export default EditorBottomBar;
