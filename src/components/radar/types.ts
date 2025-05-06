// Radar target types
export interface RadarTarget {
  id: string;
  distance: number; // Distance from own ship in nautical miles
  bearing: number; // Bearing in degrees from own ship (0-359)
  size: number; // Size of the target (0-1) affects echo strength
  speed: number; // Speed in knots
  course: number; // Course in degrees (0-359)
  type: 'ship' | 'land' | 'buoy' | 'other';
  isTracked?: boolean; // Whether ARPA is tracking this target
}

// Radar band types
export type RadarBand = 'X' | 'S';

// Radar display settings
export interface RadarSettings {
  band: RadarBand;
  range: number; // Range in nautical miles
  gain: number; // Gain level (0-100)
  seaClutter: number; // Sea clutter suppression (0-100)
  rainClutter: number; // Rain clutter suppression (0-100)
  heading: number; // Ship heading in degrees (0-359)
  orientation: 'north-up' | 'head-up' | 'course-up';
  trails: boolean; // Whether to show target trails
  trailDuration: number; // Trail duration in seconds
  nightMode: boolean; // Whether to use night mode colors
}

// Environmental conditions affecting radar
export interface RadarEnvironment {
  seaState: number; // Sea state (0-10), affects sea clutter
  rainIntensity: number; // Rain intensity (0-10), affects rain clutter
  visibility: number; // Visibility (0-10), affects general detection
}

// Electronic Bearing Line (EBL)
export interface EBL {
  active: boolean;
  angle: number; // Angle in degrees (0-359)
}

// Variable Range Marker (VRM)
export interface VRM {
  active: boolean;
  distance: number; // Distance in nautical miles
}

// Guard zone for collision warnings
export interface GuardZone {
  active: boolean;
  startAngle: number; // Start angle in degrees
  endAngle: number; // End angle in degrees
  innerRange: number; // Inner range in nautical miles
  outerRange: number; // Outer range in nautical miles
}
