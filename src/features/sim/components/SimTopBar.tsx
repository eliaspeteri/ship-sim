import React from 'react';

type Notice = {
  type: 'error' | 'info';
  message: string;
};

type SimTopBarProps = {
  notice: Notice | null;
  showHelmControl: boolean;
  helmLabel: string;
  onToggleHelm: () => void;
  canEnterPlayerMode: boolean;
  mode: 'player' | 'spectator';
  onCreateVessel: () => void;
  onToggleMode: () => void;
  modeToggleTitle?: string;
};

const SimTopBar: React.FC<SimTopBarProps> = ({
  notice,
  showHelmControl,
  helmLabel,
  onToggleHelm,
  canEnterPlayerMode,
  mode,
  onCreateVessel,
  onToggleMode,
  modeToggleTitle,
}) => {
  return (
    <div className="fixed right-4 top-[calc(var(--nav-height,0px)+8px)] z-40 flex items-center gap-2 rounded-[12px] border border-[rgba(27,154,170,0.35)] bg-[rgba(8,18,32,0.85)] px-3 py-2 text-[var(--ink)] shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-[12px]">
      {notice ? (
        <div
          className={`rounded-[8px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            notice.type === 'error'
              ? 'bg-[rgba(145,40,32,0.85)] text-[#ffe7e1]'
              : 'bg-[rgba(24,87,132,0.8)] text-[#e6f2ff]'
          }`}
        >
          {notice.message}
        </div>
      ) : null}
      {showHelmControl ? (
        <button
          type="button"
          className="rounded-[8px] bg-[rgba(180,124,30,0.9)] px-2.5 py-1.5 text-[12px] font-semibold text-[#f4fbfc] cursor-pointer"
          onClick={onToggleHelm}
        >
          {helmLabel}
        </button>
      ) : null}
      <button
        type="button"
        disabled={!canEnterPlayerMode}
        className="rounded-[8px] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-2.5 py-1.5 text-[12px] font-semibold text-[#f4fbfc] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onCreateVessel}
      >
        Create My Vessel
      </button>
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(210,222,230,0.9)]">
        Mode
      </span>
      <button
        type="button"
        disabled={!canEnterPlayerMode && mode !== 'player'}
        onClick={onToggleMode}
        className={`rounded-[8px] border border-[rgba(60,88,104,0.6)] px-2.5 py-1.5 text-[11px] font-semibold text-[#f1f7f8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
          mode === 'player'
            ? 'bg-[rgba(24,87,132,0.8)]'
            : 'bg-[rgba(17,32,48,0.9)]'
        }`}
        title={modeToggleTitle}
      >
        {mode === 'player' ? 'Player' : 'Spectator'}
      </button>
    </div>
  );
};

export default SimTopBar;
