import React from 'react';

import type { EconomyContext } from '../economyContexts';

type EconomySidebarProps = {
  contexts: EconomyContext[];
  activeId: string;
  onSelect: (id: string) => void;
};

const EconomySidebar: React.FC<EconomySidebarProps> = ({
  contexts,
  activeId,
  onSelect,
}) => {
  return (
    <aside className="rounded-[18px] border border-[rgba(97,137,160,0.25)] bg-[rgba(8,18,30,0.85)] p-4 shadow-[0_18px_45px_rgba(4,10,20,0.35)]">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[rgba(170,192,202,0.7)]">
        Operations
      </div>
      <div className="mt-4 grid gap-2">
        {contexts.map(context => {
          const isActive = context.id === activeId;
          return (
            <button
              key={context.id}
              type="button"
              onClick={() => onSelect(context.id)}
              className={`rounded-[12px] px-3 py-2 text-left transition ${
                isActive
                  ? 'border border-[rgba(27,154,170,0.65)] bg-[rgba(15,52,72,0.7)] text-[#e9f7f9]'
                  : 'border border-transparent bg-transparent text-[rgba(210,226,236,0.85)] hover:border-[rgba(97,137,160,0.35)] hover:bg-[rgba(12,26,38,0.6)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="text-[13px] font-semibold">{context.label}</div>
              {context.description ? (
                <div className="mt-1 text-[11px] text-[rgba(170,192,202,0.65)]">
                  {context.description}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default EconomySidebar;
