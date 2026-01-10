import React, { useRef } from 'react';
import Link from 'next/link';
import { Html } from '@react-three/drei';
import styles from './VesselCallout.module.css';

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
        className={styles.offset}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <div className={styles.callout}>
          <div className={styles.header} onPointerDown={handlePointerDown}>
            <div className={styles.title}>{title}</div>
            <button
              type="button"
              className={styles.close}
              onPointerDown={event => event.stopPropagation()}
              onClick={onClose}
            >
              x
            </button>
          </div>
          <div className={styles.grid}>
            {rows.map(row => (
              <div key={row.label} className={styles.row}>
                <div className={styles.label}>{row.label}</div>
                <div className={styles.value}>{row.value}</div>
              </div>
            ))}
          </div>
          <div className={styles.footer}>
            <Link href={`/vessels/${vesselId}`} className={styles.link}>
              Go to vessel page -&gt;
            </Link>
            {actions.length > 0 ? (
              <div className={styles.actions}>
                {actions.map(action => (
                  <button
                    key={action.label}
                    type="button"
                    onPointerDown={event => event.stopPropagation()}
                    onClick={action.onClick}
                    className={`${styles.actionButton} ${
                      action.variant === 'danger'
                        ? styles.actionDanger
                        : action.variant === 'ghost'
                          ? styles.actionGhost
                          : styles.actionPrimary
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
