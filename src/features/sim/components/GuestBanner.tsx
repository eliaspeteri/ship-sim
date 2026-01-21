import React from 'react';

type GuestBannerProps = {
  onDismiss: () => void;
  message?: string;
};

const GuestBanner: React.FC<GuestBannerProps> = ({
  onDismiss,
  message = 'You are viewing the simulation in read-only mode. Sign in to create or crew a vessel.',
}) => {
  return (
    <div className="fixed left-4 top-[calc(var(--nav-height,0px)+8px)] z-40 grid max-w-[360px] gap-2 rounded-[12px] border border-[rgba(27,154,170,0.35)] bg-[rgba(8,18,32,0.85)] px-3 py-2 text-[12px] text-[var(--ink)] shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-[12px]">
      <div className="flex items-center justify-between gap-2">
        <div className="rounded-full bg-[rgba(24,87,132,0.8)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#e6f2ff]">
          Guest mode
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2 py-0.5 text-[11px] font-semibold text-[#f1f7f8] cursor-pointer"
          aria-label="Dismiss guest banner"
        >
          x
        </button>
      </div>
      <div>{message}</div>
    </div>
  );
};

export default GuestBanner;
