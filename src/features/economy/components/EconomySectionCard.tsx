import React from 'react';

type EconomySectionCardProps = {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

const EconomySectionCard: React.FC<EconomySectionCardProps> = ({
  title,
  children,
  actions,
  className,
}) => {
  return (
    <section
      className={`rounded-[18px] border border-[rgba(97,137,160,0.35)] bg-[rgba(10,20,30,0.9)] p-5 shadow-[0_18px_45px_rgba(4,10,20,0.35)] ${className || ''}`}
    >
      {title || actions ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="text-[16px] font-semibold text-[var(--ink)]">
            {title}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
};

export default EconomySectionCard;
