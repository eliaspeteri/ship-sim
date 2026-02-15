import type { RadarTarget } from './types';

/**
 * ARPA Target Type - extends basic radar target with additional tracking data
 */
export interface ARPATarget extends RadarTarget {
  isTracked: boolean;
  trackId: string;
  acquiredTime: Date;
  lastUpdatedTime: Date;
  historicalPositions: {
    distance: number; // Distance from own ship in nautical miles
    bearing: number; // Bearing from own ship in degrees
    timestamp: Date;
  }[];
  calculatedCourse: number; // Calculated course in degrees
  calculatedSpeed: number; // Calculated speed in knots
  cpa: number | null; // Closest Point of Approach in nautical miles
  tcpa: number | null; // Time to CPA in minutes
  bcr: number | null; // Bow Crossing Range in nautical miles
  bcpa: number | null; // Bearing at CPA in degrees
}

/**
 * ARPA Target Status
 */
export enum ARPATargetStatus {
  ACQUIRING = 'acquiring',
  TRACKING = 'tracking',
  LOST = 'lost',
  DANGEROUS = 'dangerous', // Target is on collision course
}

/**
 * ARPA Settings
 */
export interface ARPASettings {
  autoAcquisitionEnabled: boolean;
  autoAcquisitionRange: number; // Maximum range for auto acquisition in nautical miles
  collisionWarningTime: number; // Time to CPA threshold for collision warning in minutes
  collisionWarningDistance: number; // CPA distance threshold for collision warning in nautical miles
  guardZoneEnabled: boolean;
  vectorTimeMinutes: number; // Length of vector display in minutes
  historyPointsCount: number; // Number of history points to display
  relativeVectors: boolean; // If true, show vectors relative to own ship, else true motion
}

/**
 * Ship's Own Data
 */
export interface OwnShipData {
  position: { lat: number; lon: number };
  course: number; // Course over ground in degrees
  speed: number; // Speed over ground in knots
  heading: number; // Ship's heading in degrees
}

/**
 * Default ARPA Settings
 */
export const DEFAULT_ARPA_SETTINGS: ARPASettings = {
  autoAcquisitionEnabled: true,
  autoAcquisitionRange: 6,
  collisionWarningTime: 15, // 15 minutes
  collisionWarningDistance: 0.5, // 0.5 nautical miles
  guardZoneEnabled: false,
  vectorTimeMinutes: 6,
  historyPointsCount: 5,
  relativeVectors: true,
};

/**
 * Calculate CPA (Closest Point of Approach) and TCPA (Time to CPA)
 *
 * @param target Target vessel data
 * @param ownShip Own ship data
 * @returns Object containing CPA (nautical miles) and TCPA (minutes)
 */
export const calculateCPA = (
  target: RadarTarget,
  ownShip: OwnShipData,
): { cpa: number; tcpa: number; bcpa: number } => {
  // Convert degrees to radians
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  // Target course and speed in radians and knots
  const targetCourseRad = toRadians(target.course);
  const targetSpeed = target.speed;

  // Own ship course and speed in radians and knots
  const ownCourseRad = toRadians(ownShip.course);
  const ownSpeed = ownShip.speed;

  // Calculate relative bearing and distance
  const targetBearingRad = toRadians(target.bearing);
  const targetDistance = target.distance;

  // Calculate relative velocity components
  const targetVelocityX = targetSpeed * Math.sin(targetCourseRad);
  const targetVelocityY = targetSpeed * Math.cos(targetCourseRad);

  const ownVelocityX = ownSpeed * Math.sin(ownCourseRad);
  const ownVelocityY = ownSpeed * Math.cos(ownCourseRad);

  const relativeVelocityX = targetVelocityX - ownVelocityX;
  const relativeVelocityY = targetVelocityY - ownVelocityY;
  const relativeVelocity = Math.sqrt(
    relativeVelocityX ** 2 + relativeVelocityY ** 2,
  );

  // If relative velocity is near zero, they are moving at the same speed and direction
  if (relativeVelocity < 0.1) {
    return { cpa: targetDistance, tcpa: Infinity, bcpa: target.bearing };
  }

  // Calculate target's position in Cartesian coordinates relative to own ship
  const targetX = targetDistance * Math.sin(targetBearingRad);
  const targetY = targetDistance * Math.cos(targetBearingRad);

  // Calculate time to CPA
  const dotProduct = targetX * relativeVelocityX + targetY * relativeVelocityY;
  const tcpaHours = -dotProduct / relativeVelocity ** 2;

  // If TCPA is negative, the closest point is in the past
  if (tcpaHours < 0) {
    return { cpa: targetDistance, tcpa: -tcpaHours * 60, bcpa: target.bearing };
  }

  // Calculate position at CPA
  const cpaX = targetX + relativeVelocityX * tcpaHours;
  const cpaY = targetY + relativeVelocityY * tcpaHours;

  // Calculate CPA distance
  const cpaDistance = Math.sqrt(cpaX ** 2 + cpaY ** 2);

  // Calculate bearing at CPA
  const bcpaRad = Math.atan2(cpaX, cpaY);
  const bcpa = ((bcpaRad * 180) / Math.PI + 360) % 360;

  return {
    cpa: cpaDistance,
    tcpa: tcpaHours * 60, // Convert hours to minutes
    bcpa,
  };
};

/**
 * Determine if a target poses a collision risk
 */
export const isCollisionRisk = (
  target: ARPATarget,
  settings: ARPASettings,
): boolean => {
  if (target.cpa === null || target.tcpa === null) return false;

  return (
    target.cpa <= settings.collisionWarningDistance &&
    target.tcpa <= settings.collisionWarningTime &&
    target.tcpa > 0 // Only future collisions
  );
};

/**
 * Calculate the target status based on tracking data
 */
export const getTargetStatus = (
  target: ARPATarget,
  settings: ARPASettings,
): ARPATargetStatus => {
  // Check if target was just acquired (less than 30 seconds ago)
  const acquisitionTime =
    (new Date().getTime() - target.acquiredTime.getTime()) / 1000;
  if (acquisitionTime < 30) {
    return ARPATargetStatus.ACQUIRING;
  }

  // Check if target was updated recently (within last 60 seconds)
  const lastUpdateTime =
    (new Date().getTime() - target.lastUpdatedTime.getTime()) / 1000;
  if (lastUpdateTime > 60) {
    return ARPATargetStatus.LOST;
  }

  // Check if target poses collision risk
  if (isCollisionRisk(target, settings)) {
    return ARPATargetStatus.DANGEROUS;
  }

  return ARPATargetStatus.TRACKING;
};

/**
 * Convert a regular RadarTarget to an ARPATarget
 */
export const convertToARPATarget = (
  target: RadarTarget,
  ownShip: OwnShipData,
): ARPATarget => {
  const now = new Date();

  // Calculate CPA and TCPA
  const { cpa, tcpa, bcpa } = calculateCPA(target, ownShip);

  // Create new ARPA target
  const arpaTarget: ARPATarget = {
    ...target,
    isTracked: true,
    trackId: `ARPA-${target.id}`,
    acquiredTime: now,
    lastUpdatedTime: now,
    historicalPositions: [
      {
        distance: target.distance,
        bearing: target.bearing,
        timestamp: now,
      },
    ],
    calculatedCourse: target.course || 0,
    calculatedSpeed: target.speed || 0,
    cpa,
    tcpa,
    bcr: null, // Will be calculated later as we get more position data
    bcpa,
  };

  return arpaTarget;
};

/**
 * Update an existing ARPA target with new radar data
 */
export const updateARPATarget = (
  arpaTarget: ARPATarget,
  newTarget: RadarTarget,
  ownShip: OwnShipData,
): ARPATarget => {
  const now = new Date();

  // Add current position to historical positions
  const updatedHistoricalPositions = [
    ...arpaTarget.historicalPositions,
    {
      distance: newTarget.distance,
      bearing: newTarget.bearing,
      timestamp: now,
    },
  ];

  // Keep only the most recent positions based on settings
  while (updatedHistoricalPositions.length > 10) {
    updatedHistoricalPositions.shift();
  }

  // Calculate speed and course based on historical positions if we have enough data
  let calculatedCourse = newTarget.course || arpaTarget.calculatedCourse;
  let calculatedSpeed = newTarget.speed || arpaTarget.calculatedSpeed;

  if (updatedHistoricalPositions.length >= 2) {
    // Get the oldest and newest positions
    const oldestPosition = updatedHistoricalPositions[0];
    const newestPosition =
      updatedHistoricalPositions[updatedHistoricalPositions.length - 1];

    // Time difference in hours
    const timeDiffHours =
      (newestPosition.timestamp.getTime() -
        oldestPosition.timestamp.getTime()) /
      3600000;

    if (timeDiffHours > 0) {
      // Calculate relative movement
      const distanceChange = calculateDistanceBetweenPoints(
        oldestPosition.distance,
        oldestPosition.bearing,
        newestPosition.distance,
        newestPosition.bearing,
      );

      // Calculate bearing change
      const bearingChange = calculateBearingBetweenPoints(
        oldestPosition.distance,
        oldestPosition.bearing,
        newestPosition.distance,
        newestPosition.bearing,
      );

      // Calculate speed in knots
      calculatedSpeed = distanceChange / timeDiffHours;

      // Calculate course
      calculatedCourse = bearingChange;
    }
  }

  // Calculate new CPA and TCPA
  const { cpa, tcpa, bcpa } = calculateCPA(
    { ...newTarget, course: calculatedCourse, speed: calculatedSpeed },
    ownShip,
  );

  // Return updated ARPA target
  return {
    ...arpaTarget,
    ...newTarget,
    lastUpdatedTime: now,
    historicalPositions: updatedHistoricalPositions,
    calculatedCourse,
    calculatedSpeed,
    cpa,
    tcpa,
    bcpa,
  };
};

/**
 * Calculate the distance between two points given in polar coordinates
 */
export const calculateDistanceBetweenPoints = (
  ...args: [
    distance1: number,
    bearing1: number,
    distance2: number,
    bearing2: number,
  ]
): number => {
  const [distance1, bearing1, distance2, bearing2] = args;
  // Convert degrees to radians
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  // Convert to Cartesian coordinates
  const x1 = distance1 * Math.sin(toRadians(bearing1));
  const y1 = distance1 * Math.cos(toRadians(bearing1));

  const x2 = distance2 * Math.sin(toRadians(bearing2));
  const y2 = distance2 * Math.cos(toRadians(bearing2));

  // Calculate Euclidean distance
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Calculate the bearing between two points given in polar coordinates
 */
export const calculateBearingBetweenPoints = (
  ...args: [
    distance1: number,
    bearing1: number,
    distance2: number,
    bearing2: number,
  ]
): number => {
  const [distance1, bearing1, distance2, bearing2] = args;
  // Convert degrees to radians
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  // Convert to Cartesian coordinates
  const x1 = distance1 * Math.sin(toRadians(bearing1));
  const y1 = distance1 * Math.cos(toRadians(bearing1));

  const x2 = distance2 * Math.sin(toRadians(bearing2));
  const y2 = distance2 * Math.cos(toRadians(bearing2));

  // Calculate vector from point 1 to point 2
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Calculate bearing in radians
  const bearingRad = Math.atan2(dx, dy);

  // Convert radians to degrees and normalize to 0-360
  return ((bearingRad * 180) / Math.PI + 360) % 360;
};

/**
 * Auto-acquire targets based on ARPA settings
 */
export const autoAcquireTargets = (
  ...args: [
    targets: RadarTarget[],
    arpaTargets: ARPATarget[],
    settings: ARPASettings,
    ownShip: OwnShipData,
  ]
): ARPATarget[] => {
  const [targets, arpaTargets, settings, ownShip] = args;
  // Skip if auto-acquisition is disabled
  if (!settings.autoAcquisitionEnabled) {
    return arpaTargets;
  }

  const result = [...arpaTargets];
  const existingIds = new Set(arpaTargets.map(t => t.id));

  // Find targets that are not yet being tracked and are within acquisition range
  const newTargets = targets.filter(
    target =>
      !existingIds.has(target.id) &&
      target.distance <= settings.autoAcquisitionRange &&
      target.type !== 'land', // Don't auto-acquire land targets
  );

  // Convert new targets to ARPA targets
  newTargets.forEach(target => {
    result.push(convertToARPATarget(target, ownShip));
  });

  return result;
};

/**
 * Process all radar targets and update ARPA data
 */
export const processRadarTargets = (
  ...args: [
    radarTargets: RadarTarget[],
    arpaTargets: ARPATarget[],
    settings: ARPASettings,
    ownShip: OwnShipData,
  ]
): ARPATarget[] => {
  const [radarTargets, arpaTargets, settings, ownShip] = args;
  // First, auto-acquire any new targets
  const updatedArpaTargets = autoAcquireTargets(
    radarTargets,
    arpaTargets,
    settings,
    ownShip,
  );

  // Create a map of existing ARPA targets for quick lookup
  const arpaTargetsMap = new Map<string, ARPATarget>();
  updatedArpaTargets.forEach(target => {
    arpaTargetsMap.set(target.id, target);
  });

  // Update existing ARPA targets with new radar data
  const result: ARPATarget[] = [];
  const now = new Date();

  radarTargets.forEach(radarTarget => {
    if (arpaTargetsMap.has(radarTarget.id)) {
      // Update existing ARPA target
      const arpaTarget = arpaTargetsMap.get(radarTarget.id)!;
      result.push(updateARPATarget(arpaTarget, radarTarget, ownShip));
    }
  });

  // Handle targets that were not seen in this radar scan
  updatedArpaTargets.forEach(arpaTarget => {
    const radarTarget = radarTargets.find(rt => rt.id === arpaTarget.id);
    if (!radarTarget) {
      // Target not seen in current scan
      const lastUpdateTime =
        (now.getTime() - arpaTarget.lastUpdatedTime.getTime()) / 1000;
      if (lastUpdateTime < 120) {
        // Keep tracking for 2 minutes after last sighting
        result.push(arpaTarget);
      }
    }
  });

  return result;
};

/**
 * Create a vector endpoint for an ARPA target based on its course and speed
 */
export const getVectorEndpoint = (
  target: ARPATarget,
  settings: ARPASettings,
  ownShip: OwnShipData,
): { distance: number; bearing: number } => {
  // Convert degrees to radians
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  const targetCourseRad = toRadians(target.calculatedCourse || target.course);
  const targetSpeed = target.calculatedSpeed || target.speed;
  const vectorTimeHours = settings.vectorTimeMinutes / 60;

  if (settings.relativeVectors) {
    // Relative vector calculations
    const ownCourseRad = toRadians(ownShip.course);
    const ownSpeed = ownShip.speed;

    // Calculate velocity components
    const targetVelocityX = targetSpeed * Math.sin(targetCourseRad);
    const targetVelocityY = targetSpeed * Math.cos(targetCourseRad);

    const ownVelocityX = ownSpeed * Math.sin(ownCourseRad);
    const ownVelocityY = ownSpeed * Math.cos(ownCourseRad);

    const relativeVelocityX = targetVelocityX - ownVelocityX;
    const relativeVelocityY = targetVelocityY - ownVelocityY;

    // Calculate endpoint in Cartesian coordinates
    const targetBearingRad = toRadians(target.bearing);
    const targetDistance = target.distance;

    const targetX = targetDistance * Math.sin(targetBearingRad);
    const targetY = targetDistance * Math.cos(targetBearingRad);

    const endpointX = targetX + relativeVelocityX * vectorTimeHours;
    const endpointY = targetY + relativeVelocityY * vectorTimeHours;

    // Convert back to polar coordinates
    const endpointDistance = Math.sqrt(endpointX ** 2 + endpointY ** 2);
    const endpointBearingRad = Math.atan2(endpointX, endpointY);
    const endpointBearing = ((endpointBearingRad * 180) / Math.PI + 360) % 360;

    return { distance: endpointDistance, bearing: endpointBearing };
  } else {
    // True vector calculations - simpler, just project along the target's course
    const distanceTraveled = targetSpeed * vectorTimeHours; // Distance in nautical miles

    // Calculate endpoint in Cartesian coordinates
    const targetBearingRad = toRadians(target.bearing);
    const targetDistance = target.distance;

    const targetX = targetDistance * Math.sin(targetBearingRad);
    const targetY = targetDistance * Math.cos(targetBearingRad);

    const endpointX = targetX + distanceTraveled * Math.sin(targetCourseRad);
    const endpointY = targetY + distanceTraveled * Math.cos(targetCourseRad);

    // Convert back to polar coordinates
    const endpointDistance = Math.sqrt(endpointX ** 2 + endpointY ** 2);
    const endpointBearingRad = Math.atan2(endpointX, endpointY);
    const endpointBearing = ((endpointBearingRad * 180) / Math.PI + 360) % 360;

    return { distance: endpointDistance, bearing: endpointBearing };
  }
};
