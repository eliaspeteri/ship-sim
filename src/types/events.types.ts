// Event system for logging and scenarios
export interface EventLogEntry {
  id: string;
  timestamp: number; // Simulation time
  category:
    | 'navigation'
    | 'engine'
    | 'alarm'
    | 'environmental'
    | 'system'
    | 'crew';
  type: string; // Specific event type
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, unknown>; // Additional event data
}
