import { Html } from '@react-three/drei';
import Link from 'next/link';
import React, { useRef } from 'react';

type CalloutAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
};

type CalloutRow = {
  label: string;
  value: string;
};

type VesselCalloutProps = {
  vesselId: string;
  title: string;
  position: { x: number; y: number; z: number };
  rows: CalloutRow[];
  offset: { x: number; y: number };
  onOffsetChange: (next: { x: number; y: number }) => void;
  onClose: () => void;
  actions?: CalloutAction[];
};

const ui = {
  offset: 'pointer-events-auto',
  callout:
    'relative min-w-[220px] max-w-[280px] rounded-[14px] border border-[rgba(38,70,90,0.7)] bg-[rgba(8,18,30,0.92)] px-[14px] py-3 text-[#eef7f8] shadow-[0_12px_30px_rgba(4,10,18,0.6)] after:absolute after:bottom-[-10px] after:left-[34px] after:border-x-[10px] after:border-b-0 after:border-t-[10px] after:border-solid after:border-x-transparent after:border-t-[rgba(8,18,30,0.92)] after:content-[""]',
  header: 'mb-2.5 flex cursor-grab items-center justify-between',
  title: 'text-[13px] font-semibold text-[#f1f7f8]',
  close:
    'cursor-pointer border-0 bg-transparent text-sm leading-none text-[rgba(210,224,230,0.8)]',
  grid: 'grid gap-1.5',
  row: 'flex justify-between gap-3',
  label: 'text-[10px] uppercase tracking-[0.12em] text-[rgba(150,168,182,0.7)]',
  value: 'text-xs font-semibold text-[#eef7f8]',
  footer: 'mt-2.5 grid gap-2',
  link: 'text-xs text-[#7fd5e2] no-underline',
  actions: 'flex flex-wrap gap-1.5',
  actionButton:
    'cursor-pointer rounded-lg border-0 px-2.5 py-1.5 text-[11px] font-semibold text-[#f1f7f8]',
  actionPrimary: 'bg-gradient-to-br from-[#1b9aaa] to-[#0f6d75]',
  actionDanger: 'bg-[rgba(120,36,32,0.85)]',
  actionGhost: 'border border-[rgba(60,88,104,0.7)] bg-[rgba(30,50,68,0.7)]',
};

const VesselCallout: React.FC<VesselCalloutProps> = ({
  vesselId,
  title,
  position,
  rows,
  offset,
  onOffsetChange,
  onClose,
  actions = [],
}) => {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const moveListenerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const upListenerRef = useRef<((event: PointerEvent) => void) | null>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (typeof window === 'undefined') return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;
      onOffsetChange({
        x: dragRef.current.originX + deltaX,
        y: dragRef.current.originY + deltaY,
      });
    };
    const handleUp = () => {
      if (moveListenerRef.current) {
        window.removeEventListener('pointermove', moveListenerRef.current);
      }
      if (upListenerRef.current) {
        window.removeEventListener('pointerup', upListenerRef.current);
        window.removeEventListener('pointercancel', upListenerRef.current);
      }
      dragRef.current = null;
    };
    moveListenerRef.current = handleMove;
    upListenerRef.current = handleUp;
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  return (
    <Html position={[position.x, position.y, position.z]} center>
      <div
        className={ui.offset}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <div className={ui.callout}>
          <div className={ui.header} onPointerDown={handlePointerDown}>
            <div className={ui.title}>{title}</div>
            <button
              type="button"
              className={ui.close}
              onPointerDown={event => event.stopPropagation()}
              onClick={onClose}
            >
              x
            </button>
          </div>
          <div className={ui.grid}>
            {rows.map(row => (
              <div key={row.label} className={ui.row}>
                <div className={ui.label}>{row.label}</div>
                <div className={ui.value}>{row.value}</div>
              </div>
            ))}
          </div>
          <div className={ui.footer}>
            <Link
              href={`/vessels/${vesselId}`}
              className={ui.link}
              target="_blank"
            >
              Go to vessel page -&gt;
            </Link>
            {actions.length > 0 ? (
              <div className={ui.actions}>
                {actions.map(action => (
                  <button
                    key={action.label}
                    type="button"
                    onPointerDown={event => event.stopPropagation()}
                    onClick={action.onClick}
                    className={`${ui.actionButton} ${
                      action.variant === 'danger'
                        ? ui.actionDanger
                        : action.variant === 'ghost'
                          ? ui.actionGhost
                          : ui.actionPrimary
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Html>
  );
};

export default VesselCallout;
