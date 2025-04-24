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
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-info';
      default:
        return 'text-base-content';
    }
  };

  return (
    <div className="card bg-base-300 shadow-xl">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="card-title text-lg">Event Log</h3>
          <span className="text-xs opacity-70">{eventLog.length} events</span>
        </div>

        <div
          ref={containerRef}
          className="h-40 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {eventLog.length === 0 ? (
            <div className="text-center opacity-50 italic">
              No events logged yet
            </div>
          ) : (
            <table className="table table-compact w-full">
              <tbody>
                {eventLog
                  .sort((a, b) => b.timestamp - a.timestamp) // Sort in descending order
                  .map((event, index) => (
                    <tr key={index} className="hover">
                      <td className="font-mono text-xs opacity-70 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td
                        className={`${getEventSeverityClass(event.severity)}`}
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
