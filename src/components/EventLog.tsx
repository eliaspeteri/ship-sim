import React, { useEffect, useRef } from 'react';

import useStore from '../store';

/**
 * Event Log component that displays system events with timestamps
 * Shows events color-coded by severity and auto-scrolls to the latest event
 */
export const EventLog: React.FC = () => {
  const eventLog = useStore(state => state.eventLog);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new events are added
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [eventLog]);

  // Get color class based on event severity
  const getEventSeverityClass = (severity: string = 'info'): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-300';
      case 'info':
        return 'text-sky-300';
      default:
        return 'text-slate-200';
    }
  };

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 shadow-xl">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Event Log</h3>
          <span className="text-xs text-gray-400">
            {eventLog.length} events
          </span>
        </div>

        <div
          ref={containerRef}
          className="h-40 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {eventLog.length === 0 ? (
            <div className="text-center text-sm italic text-gray-400">
              No events logged yet
            </div>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {eventLog
                  .sort((a, b) => b.timestamp - a.timestamp) // Sort in descending order
                  .map((event, index) => (
                    <tr
                      key={index}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap px-1 py-1 font-mono text-[11px] text-gray-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td
                        className={`px-1 py-1 ${getEventSeverityClass(event.severity)}`}
                      >
                        {event.message}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLog;
