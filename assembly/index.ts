// Ship simulator physics core - Implementing advanced hydrodynamics and propulsion

// IMPORTANT: Keep a reference to a single vessel state to avoid memory leaks
let globalVessel: VesselState | null = null;

// Vessel state representation
class VesselState {
  // Position and orientation
  x: f64;
  y: f64;
  z: f64;
  psi: f64; // heading (yaw)
  phi: f64; // roll
  theta: f64; // pitch

  // Linear and angular velocities
  u: f64; // surge (forward/aft)
  v: f64; // sway (lateral)
  w: f64; // heave (vertical)
  r: f64; // yaw rate
  p: f64; // roll rate
  q: f64; // pitch rate

  // Control inputs
  throttle: f64; // 0.0 - 1.0
  rudderAngle: f64; // radians

  // Vessel properties
  mass: f64; // kg
  length: f64; // m
  beam: f64; // m
  draft: f64; // m

  // Advanced physics properties
  // Hydrodynamics
  blockCoefficient: f64; // Block coefficient for hull resistance calculation
  waterDensity: f64; // kg/m³

  // Propulsion
  engineRPM: f64; // Engine RPM
  maxEnginePower: f64; // Max power in kW
  fuelConsumption: f64; // kg/h
  propellerDiameter: f64; // m

  // Mass & Stability
  centerOfGravityX: f64; // LCG in m from midship
  centerOfGravityY: f64; // TCG in m from centerline
  centerOfGravityZ: f64; // VCG in m from keel
  displacement: f64; // m³

  // Moments of inertia
  Ixx: f64; // kg·m²
  Iyy: f64; // kg·m²
  Izz: f64; // kg·m²

  // Tank states
  fuelLevel: f64; // 0.0 - 1.0
  ballastLevel: f64; // 0.0 - 1.0

  // Wave state data
  waveHeight: f64; // Current wave height affecting vessel
  waveDirection: f64; // Direction waves are coming from
  waveFrequency: f64; // Frequency of wave pattern
  wavePhase: f64; // Current phase of wave pattern at vessel position

  constructor(
    x: f64,
    y: f64,
    z: f64,
    psi: f64,
    phi: f64,
    theta: f64,
    u: f64,
    v: f64,
    w: f64,
    r: f64,
    p: f64,
    q: f64,
    throttle: f64,
    rudderAngle: f64,
    mass: f64,
    length: f64,
    beam: f64,
    draft: f64,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.psi = psi;
    this.phi = phi;
    this.theta = theta;
    this.u = u;
    this.v = v;
    this.w = w;
    this.r = r;
    this.p = p;
    this.q = q;
    this.throttle = throttle;
    this.rudderAngle = rudderAngle;
    this.mass = mass;
    this.length = length;
    this.beam = beam;
    this.draft = draft;

    // Initialize advanced physics properties with default values
    this.blockCoefficient = 0.8;
    this.waterDensity = 1025.0;

    this.engineRPM = 0.0;
    this.maxEnginePower = 2000.0;
    this.fuelConsumption = 0.0;
    this.propellerDiameter = 3.0;

    this.centerOfGravityX = 0.0;
    this.centerOfGravityY = 0.0;
    this.centerOfGravityZ = draft * 0.5;
    this.displacement = this.calculateDisplacement();

    // Approximate moments of inertia for a ship
    this.Ixx = (mass * (beam * beam + draft * draft)) / 12;
    this.Iyy = (mass * (length * length + draft * draft)) / 12;
    this.Izz = (mass * (length * length + beam * beam)) / 12;

    this.fuelLevel = 1.0;
    this.ballastLevel = 0.5;

    // Initialize wave state
    this.waveHeight = 0.0;
    this.waveDirection = 0.0;
    this.waveFrequency = 0.0;
    this.wavePhase = 0.0;
  }

  // Calculate approximate displacement
  private calculateDisplacement(): f64 {
    return this.length * this.beam * this.draft * this.blockCoefficient;
  }
}

// Holtrop-Mennen model constants
const HM_C1 = 2223105.0;
const HM_C2 = 4.0;
const HM_C3 = 0.5;
const HM_C4 = 0.15;

// Wave physics constants
const WAVE_GRAVITY = 9.81; // m/s²
const WAVE_LENGTH_FACTOR = 1.5; // Wave length multiplier based on sea state
const BEAUFORT_WAVE_HEIGHTS = [
  0.0, 0.1, 0.2, 0.6, 1.0, 2.0, 3.0, 4.0, 5.5, 7.0, 9.0, 11.5, 14.0,
];

/**
 * Calculates the wave frequency for a given sea state.
 * @param seaState - The sea state (0-12, Beaufort scale)
 * @returns The wave frequency in radians per second
 * @external
 */
export function calculateWaveFrequency(seaState: f64): f64 {
  const wavePeriod = 3.0 + seaState * 1.6;
  return (2.0 * Math.PI) / wavePeriod;
}

// Calculate hull resistance using simplified Holtrop-Mennen method
function calculateHullResistance(vessel: VesselState, speed: f64): f64 {
  if (speed < 0.01) return 0.0;

  // Calculate wetted surface area (approximation)
  const wettedArea =
    vessel.length *
    (2.0 * vessel.draft + vessel.beam) *
    Math.sqrt(vessel.blockCoefficient) *
    0.8;

  // Calculate Froude number
  const froudeNum = speed / Math.sqrt(9.81 * vessel.length);

  // Calculate Reynolds number
  const kineViscosity = 0.000001187; // m²/s at 20°C
  const reynoldsNum = (speed * vessel.length) / kineViscosity;

  // Friction resistance coefficient (ITTC-57)
  const Cf = 0.075 / Math.pow(Math.log10(reynoldsNum) - 2.0, 2.0);

  // Friction resistance
  const Rf = 0.5 * vessel.waterDensity * speed * speed * wettedArea * Cf;

  // Residual resistance (simplified from Holtrop-Mennen)
  const Rr =
    HM_C1 *
    vessel.displacement *
    Math.pow(froudeNum, HM_C2) *
    Math.exp(-HM_C3 / Math.pow(froudeNum, HM_C4));

  // Total resistance
  const Rt = Rf + Rr;

  return Rt;
}

// Calculate wave resistance based on sea state
function calculateWaveResistance(vessel: VesselState, seaState: f64): f64 {
  // Simplified calculation based on sea state (Beaufort scale 0-12)
  const waveHeight = Math.pow(seaState, 2.0) * 0.05; // Approximate wave height in meters

  // Added resistance increases with square of wave height and is proportional to vessel size
  const addedResistance =
    (500.0 * waveHeight * waveHeight * vessel.length * vessel.beam) / 100.0;

  return addedResistance;
}

// Calculate propeller thrust from engine torque and ship speed
function calculatePropellerThrust(vessel: VesselState): f64 {
  const engineTorque = calculateEngineTorque(vessel);

  // Calculate wake fraction (simplified)
  const wakeFraction = 0.3 * vessel.blockCoefficient;

  // Speed of advance to the propeller
  const speedAdvance = vessel.u * (1.0 - wakeFraction);

  // Calculate propeller advance coefficient J
  const propRPS = vessel.engineRPM / 60.0 / 3.0; // Assuming 3:1 gear ratio
  const J =
    Math.abs(speedAdvance) / (propRPS * vessel.propellerDiameter + 0.001);

  // Simplified thrust coefficient based on advance coefficient
  const KT = Math.max(0.0, 0.5 - 0.4 * J); // Approximation of thrust coefficient

  // Calculate propeller thrust
  const thrust =
    KT *
    vessel.waterDensity *
    propRPS *
    propRPS *
    Math.pow(vessel.propellerDiameter, 4.0);

  // Calculate fuel consumption
  vessel.fuelConsumption = calculateFuelConsumption(vessel, engineTorque);

  return thrust;
}

// Calculate diesel engine torque based on RPM
function calculateEngineTorque(vessel: VesselState): f64 {
  // Simplified diesel engine torque curve characteristics
  const maxTorque = (vessel.maxEnginePower * 9550.0) / 0.8 / vessel.engineRPM; // Nm at peak torque RPM
  const rpmRatio = vessel.engineRPM / (vessel.maxEnginePower / 5.0); // Normalized RPM

  // Simplified torque curve, peaking at around 80% of max RPM
  let torqueFactor: f64;
  if (rpmRatio < 0.1) {
    torqueFactor = rpmRatio * 5.0; // Linear increase at very low RPM
  } else if (rpmRatio < 0.8) {
    torqueFactor = 0.5 + rpmRatio / 1.6; // Increasing to peak
  } else {
    torqueFactor = 1.0 - (rpmRatio - 0.8) / 2.0; // Decreasing after peak
  }

  return maxTorque * torqueFactor * vessel.throttle;
}

// Calculate fuel consumption based on engine power and RPM
function calculateFuelConsumption(vessel: VesselState, torque: f64): f64 {
  // Simple model: consumption proportional to torque and RPM
  const powerFactor = (torque * vessel.engineRPM) / 9550.0; // Power in kW

  // Specific fuel consumption (g/kWh) - lower at optimal load
  let sfc: f64;
  const loadFactor = powerFactor / vessel.maxEnginePower;

  // SFC curve with minimum around 80% load
  if (loadFactor < 0.2) {
    sfc = 220.0 + (0.2 - loadFactor) * 400.0; // Higher at very low loads
  } else if (loadFactor < 0.8) {
    sfc = 220.0 - (loadFactor - 0.2) * 20.0; // Decreasing to optimal
  } else {
    sfc = 200.0 + (loadFactor - 0.8) * 50.0; // Increasing after optimal
  }

  // Calculate consumption in kg/h
  return (powerFactor * sfc) / 1000.0;
}

// Calculate rudder drag force
function calculateRudderDrag(vessel: VesselState): f64 {
  const speed = Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
  if (speed < 0.01) return 0.0;

  // Rudder characteristics
  const aspectRatio = 1.5;
  const rudderArea = 0.02 * vessel.length * vessel.draft;
  const rudderLift =
    ((Math.PI * aspectRatio) / (1.0 + aspectRatio)) *
    vessel.rudderAngle *
    rudderArea *
    0.5 *
    vessel.waterDensity *
    speed *
    speed;

  // Calculate drag force in x direction
  return Math.abs(rudderLift) * Math.sin(Math.abs(vessel.rudderAngle));
}

// Calculate rudder force in Y direction (sway force)
function calculateRudderForceY(vessel: VesselState): f64 {
  const speed = Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
  if (speed < 0.01) return 0.0;

  // Rudder characteristics
  const aspectRatio = 1.5;
  const rudderArea = 0.02 * vessel.length * vessel.draft;
  const rudderLift =
    ((Math.PI * aspectRatio) / (1.0 + aspectRatio)) *
    vessel.rudderAngle *
    rudderArea *
    0.5 *
    vessel.waterDensity *
    speed *
    speed;

  // Sway force from rudder
  return rudderLift * Math.cos(vessel.rudderAngle);
}

// Calculate rudder moment around Z axis (yaw moment)
function calculateRudderMomentZ(vessel: VesselState): f64 {
  const rudderForceY = calculateRudderForceY(vessel);

  // Rudder location (typically near stern)
  const rudderLeverArm = -0.45 * vessel.length;

  // Yaw moment from rudder
  return rudderForceY * rudderLeverArm;
}

// Calculate current effects on the vessel
function calculateCurrentForce(
  vessel: VesselState,
  currentSpeed: f64,
  currentDirection: f64,
): f64[] {
  // Relative current direction
  const relativeDirection = currentDirection - vessel.psi;

  // Wetted area (simplified)
  const wettedAreaSide = vessel.length * vessel.draft * 0.7;
  const wettedAreaBottom =
    vessel.length * vessel.beam * vessel.blockCoefficient;

  // Current coefficients
  const currentCoefficientX = 0.5 + 0.3 * Math.abs(Math.cos(relativeDirection));
  const currentCoefficientY = 0.8 * Math.abs(Math.sin(relativeDirection));
  const currentCoefficientN = 0.1 * Math.sin(2.0 * relativeDirection);

  // Calculate current forces
  const currentForceX =
    0.5 *
    vessel.waterDensity *
    currentSpeed *
    currentSpeed *
    wettedAreaBottom *
    currentCoefficientX *
    Math.cos(relativeDirection);

  const currentForceY =
    0.5 *
    vessel.waterDensity *
    currentSpeed *
    currentSpeed *
    wettedAreaSide *
    currentCoefficientY *
    Math.sin(relativeDirection);

  const currentMomentN =
    0.5 *
    vessel.waterDensity *
    currentSpeed *
    currentSpeed *
    wettedAreaSide *
    vessel.length *
    currentCoefficientN;

  return [currentForceX, currentForceY, currentMomentN];
}

// Calculate center of gravity based on fuel, ballast, and cargo
// Directly update vessel CG values instead of returning an array to avoid memory allocation issues
function calculateCenterOfGravity(vessel: VesselState): void {
  // Base CG position without variable weights
  const baseCGX = 0.0;
  const baseCGY = 0.0;
  const baseCGZ = vessel.draft * 0.5;

  // Mass of base vessel (empty)
  const emptyMass = vessel.mass * 0.7;

  // Fuel tank properties (simplified)
  const fuelTankMaxMass = vessel.mass * 0.1;
  const fuelMass = fuelTankMaxMass * vessel.fuelLevel;
  const fuelCGX = -0.2 * vessel.length; // Fuel tanks typically aft
  const fuelCGZ = vessel.draft * 0.3; // Low in the vessel

  // Ballast tank properties
  const ballastTankMaxMass = vessel.mass * 0.2;
  const ballastMass = ballastTankMaxMass * vessel.ballastLevel;
  const ballastCGZ = vessel.draft * 0.1; // Very low in the vessel

  // Calculate combined center of gravity
  const totalMass = emptyMass + fuelMass + ballastMass;

  // Update vessel CG directly
  vessel.centerOfGravityX =
    (emptyMass * baseCGX + fuelMass * fuelCGX) / totalMass;
  vessel.centerOfGravityY = (emptyMass * baseCGY) / totalMass; // Assuming symmetry in Y
  vessel.centerOfGravityZ =
    (emptyMass * baseCGZ + fuelMass * fuelCGZ + ballastMass * ballastCGZ) /
    totalMass;

  // Update vessel mass based on fuel and ballast levels
  vessel.mass = totalMass;
}

// Calculate metacentric height (GM) - a measure of stability
function calculateGM(vessel: VesselState): f64 {
  // Update CG values directly on the vessel
  calculateCenterOfGravity(vessel);

  // Use the CG values from the vessel
  const cgZ = vessel.centerOfGravityZ;

  // Calculate second moment of area of the waterplane
  const waterplaneArea = vessel.length * vessel.beam;
  const Iyy_waterplane = (waterplaneArea * vessel.beam * vessel.beam) / 12.0;

  // Calculate metacenter height above keel
  const volume = vessel.displacement;
  const KM = vessel.draft + Iyy_waterplane / (vessel.waterDensity * volume);

  // GM = KM - KG
  const GM = KM - cgZ;

  return GM;
}

/**
 * Gets the wave height for a given sea state (Beaufort scale).
 * @param seaState - The sea state (0-12, Beaufort scale)
 * @returns The wave height in meters
 * @external
 */
export function getWaveHeightForSeaState(seaState: f64): f64 {
  const index = Math.min(Math.max(0, Math.floor(seaState)), 12);
  return BEAUFORT_WAVE_HEIGHTS[index as i32];
}

/**
 * Calculates the Beaufort scale number from wind speed in m/s.
 * @param windSpeed - Wind speed in meters per second
 * @returns The Beaufort scale number (0-12)
 * @external
 */
export function calculateBeaufortScale(windSpeed: f64): i32 {
  // Convert wind speed to appropriate Beaufort scale number based on m/s
  if (windSpeed < 0.5) return 0; // Calm: < 0.5 m/s
  if (windSpeed < 1.5) return 1; // Light Air: 0.5-1.5 m/s
  if (windSpeed < 3.3) return 2; // Light Breeze: 1.6-3.3 m/s
  if (windSpeed < 5.5) return 3; // Gentle Breeze: 3.4-5.5 m/s
  if (windSpeed < 8.0) return 4; // Moderate Breeze: 5.6-8.0 m/s
  if (windSpeed < 10.8) return 5; // Fresh Breeze: 8.1-10.8 m/s
  if (windSpeed < 13.9) return 6; // Strong Breeze: 10.9-13.9 m/s
  if (windSpeed < 17.2) return 7; // Near Gale: 13.9-17.2 m/s
  if (windSpeed < 20.8) return 8; // Gale: 17.2-20.8 m/s
  if (windSpeed < 24.5) return 9; // Strong Gale: 20.8-24.5 m/s
  if (windSpeed < 28.5) return 10; // Storm: 24.5-28.5 m/s
  if (windSpeed < 32.7) return 11; // Violent Storm: 28.5-32.7 m/s
  return 12; // Hurricane: ≥ 32.7 m/s
}

/**
 * Calculates the wave length for a given sea state.
 * @param seaState - The sea state (0-12, Beaufort scale)
 * @returns The wave length in meters
 * @external
 */
export function calculateWaveLength(seaState: f64): f64 {
  const wavePeriod = 3.0 + seaState * 1.6;
  return WAVE_LENGTH_FACTOR * wavePeriod * wavePeriod;
}

/**
 * Calculates the wave height at a specific position and time.
 * @param x - X position (meters)
 * @param y - Y position (meters)
 * @param time - Simulation time (seconds)
 * @param waveHeight - Wave height (meters)
 * @param waveLength - Wave length (meters)
 * @param waveFrequency - Wave frequency (radians/second)
 * @param waveDirection - Wave direction (radians)
 * @param seaState - Sea state (Beaufort scale)
 * @returns The wave height at the given position and time
 * @external
 */
export function calculateWaveHeightAtPosition(
  x: f64,
  y: f64,
  time: f64,
  waveHeight: f64,
  waveLength: f64,
  waveFrequency: f64,
  waveDirection: f64,
  seaState: f64,
): f64 {
  if (seaState < 0.5) return 0.0;

  // Calculate wave number
  const k = (2.0 * Math.PI) / waveLength;

  // Direction vector
  const dirX = Math.cos(waveDirection);
  const dirY = Math.sin(waveDirection);

  // Dot product of position and direction
  const dot = x * dirX + y * dirY;

  // Primary wave
  const phase = k * dot - waveFrequency * time;
  let height = waveHeight * 0.5 * Math.sin(phase);

  return height; // Simplified for export compatibility
}

// Calculate wave forces on vessel
function calculateWaveForce(
  vessel: VesselState,
  seaState: f64,
  time: f64,
): f64[] {
  if (seaState < 0.5) return [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

  const waveHeight = getWaveHeightForSeaState(seaState);
  const waveLength = calculateWaveLength(seaState);
  const waveFrequency = calculateWaveFrequency(seaState);

  // Update vessel's wave state data
  vessel.waveHeight = waveHeight;
  vessel.waveFrequency = waveFrequency;

  // Calculate wave phase at vessel position
  const waveNumber = (2.0 * Math.PI) / waveLength;
  const dirX = Math.cos(vessel.waveDirection);
  const dirY = Math.sin(vessel.waveDirection);
  const positionProjection = vessel.x * dirX + vessel.y * dirY;
  vessel.wavePhase = waveNumber * positionProjection - waveFrequency * time;

  // Wave encounter angle relative to vessel heading
  const encounterAngle = vessel.waveDirection - vessel.psi;

  // Calculate relative wave direction factor
  // 0 = following sea, PI = head sea, PI/2 or 3PI/2 = beam sea
  const headSeaFactor = Math.abs(Math.cos(encounterAngle));
  const beamSeaFactor = Math.abs(Math.sin(encounterAngle));

  // Basic wave forces
  const baseWaveForce =
    vessel.waterDensity * WAVE_GRAVITY * waveHeight * waveHeight * vessel.beam;

  // Surge force (longitudinal) - stronger in head or following seas
  const surgeForce = baseWaveForce * headSeaFactor * 0.5;

  // Sway force (lateral) - stronger in beam seas
  const swayForce = baseWaveForce * beamSeaFactor * 0.7;

  // Heave force (vertical)
  const heaveFactor = Math.max(Math.sin(vessel.wavePhase), 0); // Only positive lifting force
  const heaveForce = baseWaveForce * 1.2 * heaveFactor;

  // Roll moment - strongest in beam seas
  const rollMoment =
    swayForce * vessel.draft * 0.6 * Math.sin(vessel.wavePhase);

  // Pitch moment - strongest in head/following seas
  const pitchMoment =
    surgeForce * vessel.length * 0.1 * Math.sin(vessel.wavePhase);

  // Yaw moment - complex interaction but simplified
  const yawMoment = baseWaveForce * Math.sin(2.0 * encounterAngle) * 0.05;

  // Return array: [surge, sway, heave, roll_moment, pitch_moment, yaw_moment]
  return [
    surgeForce * Math.sign(Math.cos(encounterAngle)),
    swayForce * Math.sign(Math.sin(encounterAngle)),
    heaveForce,
    rollMoment,
    pitchMoment,
    yawMoment,
  ];
}

// Calculate wind force based on wind speed and direction - X component (Surge)
function calculateWindForceX(
  vessel: VesselState,
  windSpeed: f64,
  windDirection: f64,
): f64 {
  // Relative wind direction (0 = head wind, PI = following wind)
  const relativeDirection = windDirection - vessel.psi;

  // Projected areas (simplified)
  const projectedAreaFront = vessel.beam * vessel.draft * 1.5; // Include superstructure

  // Wind coefficients
  const windCoefficientX = 0.5 + 0.4 * Math.abs(Math.cos(relativeDirection));

  // Air density
  const airDensity = 1.225; // kg/m³

  // Calculate wind force X
  return (
    0.5 *
    airDensity *
    windSpeed *
    windSpeed *
    projectedAreaFront *
    windCoefficientX *
    Math.cos(relativeDirection)
  );
}

// Calculate wind force based on wind speed and direction - Y component (Sway)
function calculateWindForceY(
  vessel: VesselState,
  windSpeed: f64,
  windDirection: f64,
): f64 {
  // Relative wind direction (0 = head wind, PI = following wind)
  const relativeDirection = windDirection - vessel.psi;

  // Projected areas (simplified)
  const projectedAreaSide = vessel.length * vessel.draft * 1.5; // Include superstructure

  // Wind coefficients
  const windCoefficientY = 0.7 * Math.abs(Math.sin(relativeDirection));

  // Air density
  const airDensity = 1.225; // kg/m³

  // Calculate wind force Y
  return (
    0.5 *
    airDensity *
    windSpeed *
    windSpeed *
    projectedAreaSide *
    windCoefficientY *
    Math.sin(relativeDirection)
  );
}

// Calculate wind moment based on wind speed and direction - N component (Yaw)
function calculateWindMomentN(
  vessel: VesselState,
  windSpeed: f64,
  windDirection: f64,
): f64 {
  // Relative wind direction (0 = head wind, PI = following wind)
  const relativeDirection = windDirection - vessel.psi;

  // Projected areas (simplified)
  const projectedAreaSide = vessel.length * vessel.draft * 1.5; // Include superstructure

  // Wind coefficients
  const windCoefficientN = 0.1 * Math.sin(2.0 * relativeDirection);

  // Air density
  const airDensity = 1.225; // kg/m³

  // Calculate wind moment N
  return (
    0.5 *
    airDensity *
    windSpeed *
    windSpeed *
    projectedAreaSide *
    vessel.length *
    windCoefficientN
  );
}

// Enhanced update function with comprehensive physics
/**
 * Updates the vessel state for the next simulation step.
 * @param vesselPtr - Pointer to the vessel instance
 * @param dt - Time step (seconds)
 * @param windSpeed - Wind speed (m/s)
 * @param windDirection - Wind direction (radians)
 * @param currentSpeed - Water current speed (m/s)
 * @param currentDirection - Water current direction (radians)
 * @returns Pointer to the updated vessel instance
 */
export function updateVesselState(
  vesselPtr: usize,
  dt: f64,
  windSpeed: f64,
  windDirection: f64,
  currentSpeed: f64,
  currentDirection: f64,
): usize {
  const vessel = changetype<VesselState>(vesselPtr);

  // Combined validation and sanitization to reduce branches
  const validDt = isFinite(dt) && dt > 0.0;
  const validVelocities = isFinite(vessel.u) && isFinite(vessel.v);

  // Defensive: skip update completely if critical values are invalid
  if (!validDt || !validVelocities) {
    return vesselPtr;
  }

  // Sanitize input parameters efficiently
  const safeDt = Math.min(dt, 1.0);
  const safeWindSpeed = isFinite(windSpeed)
    ? Math.min(Math.max(0.0, windSpeed), 50.0)
    : 0.0;
  const safeWindDirection = isFinite(windDirection)
    ? windDirection % (2.0 * Math.PI)
    : 0.0;
  const safeCurrentSpeed = isFinite(currentSpeed)
    ? Math.min(Math.max(0.0, currentSpeed), 10.0)
    : 0.0;
  const safeCurrentDirection = isFinite(currentDirection)
    ? currentDirection % (2.0 * Math.PI)
    : 0.0;

  // Calculate sea state based on wind speed for physics accuracy
  const calculatedSeaState = calculateBeaufortScale(safeWindSpeed);
  const effectiveSeaState = f64(calculatedSeaState);

  // Calculate vessel speed - already validated velocities above
  const speed = Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);

  // Calculate forces with simplified NaN protection
  // Hull resistance
  const resistance = calculateHullResistance(vessel, speed);
  const waveResistance = calculateWaveResistance(vessel, effectiveSeaState);
  const totalResistance = resistance + waveResistance;

  // Propulsion - apply realistic engine behavior
  let propulsionForce = calculatePropellerThrust(vessel);

  // If fuel level is zero, ensure no propulsion
  if (vessel.fuelLevel <= 0.0) {
    propulsionForce = 0.0;
    vessel.engineRPM = 0.0;
  }

  // Rudder forces - rudder angle already limited by setRudderAngle
  const rudderDrag = calculateRudderDrag(vessel);
  const rudderSway = calculateRudderForceY(vessel);
  const rudderYaw = calculateRudderMomentZ(vessel);

  // Environmental forces
  const windSurge = calculateWindForceX(
    vessel,
    safeWindSpeed,
    safeWindDirection,
  );
  const windSway = calculateWindForceY(
    vessel,
    safeWindSpeed,
    safeWindDirection,
  );
  const windYaw = calculateWindMomentN(
    vessel,
    safeWindSpeed,
    safeWindDirection,
  );

  const currentForces = calculateCurrentForce(
    vessel,
    safeCurrentSpeed,
    safeCurrentDirection,
  );
  const currentSurge = currentForces[0];
  const currentSway = currentForces[1];
  const currentYaw = currentForces[2];

  // Wave forces
  const simulationTime = safeDt * 100.0;
  const waveForces = calculateWaveForce(
    vessel,
    effectiveSeaState,
    simulationTime,
  );
  const waveSurge = waveForces[0];
  const waveSway = waveForces[1];
  const waveHeave = waveForces[2];
  const waveRoll = waveForces[3];
  const wavePitch = waveForces[4];
  const waveYaw = waveForces[5];

  // Define added mass factors for acceleration calculations
  const massSurge = vessel.mass * 1.1;
  const massSway = vessel.mass * 1.6;
  const massHeave = vessel.mass * 1.2;
  const inertiaRoll = vessel.Ixx * 1.1;
  const inertiaPitch = vessel.Iyy * 1.1;
  const inertiaYaw = vessel.Izz * 1.2;

  // Longitudinal dynamics (surge) - with limits
  const netForceSurge =
    propulsionForce -
    totalResistance -
    rudderDrag +
    windSurge +
    currentSurge +
    waveSurge;
  const surgeDot = netForceSurge / massSurge;

  // Apply limited acceleration (conditional with branches for better coverage)
  if (abs(surgeDot) < 100.0) {
    vessel.u += surgeDot * safeDt;
  } else if (surgeDot > 0) {
    vessel.u += 100.0 * safeDt; // Positive limit
  } else {
    vessel.u -= 100.0 * safeDt; // Negative limit
  }

  // Lateral dynamics (sway) - with limits
  const netForceSway = rudderSway + windSway + currentSway + waveSway;
  const swayDot = netForceSway / massSway;

  // Apply limited acceleration
  if (abs(swayDot) < 100.0) {
    vessel.v += swayDot * safeDt;
  } else if (swayDot > 0) {
    vessel.v += 100.0 * safeDt; // Positive limit
  } else {
    vessel.v -= 100.0 * safeDt; // Negative limit
  }

  // Vertical dynamics (heave) - with limits
  const netForceHeave = waveHeave;
  const heaveDot = netForceHeave / massHeave;

  // Apply limited acceleration with damping
  if (abs(heaveDot) < 20.0) {
    vessel.w = vessel.w * 0.95 + heaveDot * safeDt;
  } else if (heaveDot > 0) {
    vessel.w = vessel.w * 0.95 + 20.0 * safeDt;
  } else {
    vessel.w = vessel.w * 0.95 - 20.0 * safeDt;
  }

  // Roll dynamics with damping and limits
  const rollDamping = -vessel.p * 0.9;
  const netMomentRoll = waveRoll + rollDamping;
  const rollDot = netMomentRoll / inertiaRoll;

  // Apply limited acceleration
  if (abs(rollDot) < 5.0) {
    vessel.p += rollDot * safeDt;
  } else if (rollDot > 0) {
    vessel.p += 5.0 * safeDt;
  } else {
    vessel.p -= 5.0 * safeDt;
  }

  // Update roll angle with stabilizing moment
  vessel.phi += vessel.p * safeDt;
  const GM = calculateGM(vessel);
  const stabilizingMoment = -vessel.phi * GM * vessel.mass * 9.81;
  vessel.p += (stabilizingMoment / inertiaRoll) * safeDt;

  // Limit roll angle
  if (vessel.phi > 0.6) {
    vessel.phi = 0.6;
  } else if (vessel.phi < -0.6) {
    vessel.phi = -0.6;
  }

  // Pitch dynamics with damping and limits
  const pitchDamping = -vessel.q * 0.8;
  const netMomentPitch = wavePitch + pitchDamping;
  const pitchDot = netMomentPitch / inertiaPitch;

  // Apply limited acceleration
  if (abs(pitchDot) < 5.0) {
    vessel.q += pitchDot * safeDt;
  } else if (pitchDot > 0) {
    vessel.q += 5.0 * safeDt;
  } else {
    vessel.q -= 5.0 * safeDt;
  }

  // Update pitch angle with stabilizing moment
  vessel.theta += vessel.q * safeDt;
  const pitchStabilizing = -vessel.theta * vessel.length * vessel.mass * 0.05;
  vessel.q += (pitchStabilizing / inertiaPitch) * safeDt;

  // Limit pitch angle (with explicit branches for coverage)
  if (vessel.theta > 0.3) {
    vessel.theta = 0.3;
  } else if (vessel.theta < -0.3) {
    vessel.theta = -0.3;
  }

  // Yaw dynamics with limits
  const netMomentYaw = rudderYaw + windYaw + currentYaw + waveYaw;
  const yawDot = netMomentYaw / inertiaYaw;

  // Apply limited acceleration
  if (abs(yawDot) < 5.0) {
    vessel.r += yawDot * safeDt;
  } else if (yawDot > 0) {
    vessel.r += 5.0 * safeDt;
  } else {
    vessel.r -= 5.0 * safeDt;
  }

  // Update heading with normalization
  vessel.psi += vessel.r * safeDt;

  // Normalize heading to [0, 2π) range
  // Use if statements for better branch coverage
  if (vessel.psi >= 2.0 * Math.PI) {
    vessel.psi -= 2.0 * Math.PI;
    // Handle multiple rotations
    if (vessel.psi >= 2.0 * Math.PI) {
      vessel.psi %= 2.0 * Math.PI;
    }
  } else if (vessel.psi < 0.0) {
    vessel.psi += 2.0 * Math.PI;
    // Handle multiple negative rotations
    if (vessel.psi < 0.0) {
      const mod = vessel.psi % (2.0 * Math.PI);
      vessel.psi = mod < 0.0 ? mod + 2.0 * Math.PI : mod;
    }
  }

  // Position update with world coordinate transformation
  const cosPsi = Math.cos(vessel.psi);
  const sinPsi = Math.sin(vessel.psi);
  const worldU = vessel.u * cosPsi - vessel.v * sinPsi;
  const worldV = vessel.u * sinPsi + vessel.v * cosPsi;

  // Apply constrained position update
  const maxPositionDelta = 100.0 * safeDt; // Limit position change per step

  // Use separate conditionals for better branch coverage
  let deltaX = worldU * safeDt;
  if (deltaX > maxPositionDelta) {
    deltaX = maxPositionDelta;
  } else if (deltaX < -maxPositionDelta) {
    deltaX = -maxPositionDelta;
  }

  let deltaY = worldV * safeDt;
  if (deltaY > maxPositionDelta) {
    deltaY = maxPositionDelta;
  } else if (deltaY < -maxPositionDelta) {
    deltaY = -maxPositionDelta;
  }

  // Update position
  vessel.x += deltaX;
  vessel.y += deltaY;

  // Keep z at least at water level
  vessel.z += vessel.w * safeDt;
  if (vessel.z < 0.0) {
    vessel.z = 0.0;
  }

  // Fuel consumption with straightforward calculation
  if (vessel.fuelLevel > 0.0) {
    const fuelTankCapacity = vessel.mass * 0.1;
    const fuelConsumptionRate =
      vessel.fuelConsumption / 3600.0 / fuelTankCapacity;
    const effectiveFuelRate = Math.max(fuelConsumptionRate, 0.01 * safeDt);
    vessel.fuelLevel -= effectiveFuelRate * safeDt;

    if (vessel.fuelLevel < 0.0) {
      vessel.fuelLevel = 0.0;
      vessel.throttle = 0.0;
      vessel.engineRPM = 0.0;
    }
  }

  // Update the global reference
  globalVessel = vessel;
  return vesselPtr;
}

/**
 * Creates a new vessel instance and returns a pointer to it.
 * Only one vessel is supported at a time.
 * @returns Pointer to the vessel instance
 */
export function createVessel(): usize {
  if (globalVessel === null) {
    globalVessel = new VesselState(
      0,
      0,
      0, // position
      0,
      0,
      0, // orientation
      1.0,
      0,
      0, // initial speed
      0,
      0,
      0, // angular velocity
      0.2,
      0, // throttle and rudder
      50000,
      50,
      10,
      3, // vessel properties
    );
  }
  return changetype<usize>(globalVessel);
}

/**
 * Sets the throttle value for the vessel.
 * @param vesselPtr - Pointer to the vessel instance
 * @param throttle - Throttle value (0.0 to 1.0)
 */
export function setThrottle(vesselPtr: usize, throttle: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.throttle = throttle > 1.0 ? 1.0 : throttle < 0.0 ? 0.0 : throttle;

  // Update engine RPM based on throttle - directly proportional for immediate UI feedback
  vessel.engineRPM = vessel.throttle * 1200.0; // Max RPM of 1200

  // Update fuel consumption immediately based on throttle
  if (vessel.throttle > 0.01 && vessel.fuelLevel > 0) {
    // Base consumption plus throttle-dependent component
    vessel.fuelConsumption = 5.0 + vessel.throttle * vessel.throttle * 95.0; // Range from 5 to 100 kg/h
  } else {
    vessel.fuelConsumption = 0.0;
  }

  globalVessel = vessel;
}

/**
 * Sets the wave data for the vessel (for Three.js integration).
 * @param vesselPtr - Pointer to the vessel instance
 * @param height - Current wave height at vessel position
 * @param phase - Current wave phase at vessel position
 * @external
 */
export function setWaveData(vesselPtr: usize, height: f64, phase: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.waveHeight = height;
  vessel.wavePhase = phase;
  globalVessel = vessel;
}

/**
 * Sets the rudder angle for the vessel.
 * @param vesselPtr - Pointer to the vessel instance
 * @param angle - Rudder angle in radians
 */
export function setRudderAngle(vesselPtr: usize, angle: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  // Limit rudder angle to reasonable values (-35 to 35 degrees in radians)
  const maxRudder = 0.6;
  vessel.rudderAngle =
    angle > maxRudder ? maxRudder : angle < -maxRudder ? -maxRudder : angle;
  globalVessel = vessel;
}

/**
 * Sets the ballast level for the vessel.
 * @param vesselPtr - Pointer to the vessel instance
 * @param level - Ballast level (0.0 to 1.0)
 */
export function setBallast(vesselPtr: usize, level: f64): void {
  const vessel = changetype<VesselState>(vesselPtr);
  vessel.ballastLevel = level > 1.0 ? 1.0 : level < 0.0 ? 0.0 : level;

  // Update the center of gravity based on new ballast
  calculateCenterOfGravity(vessel);

  globalVessel = vessel;
}

// Wave state access functions
/**
 * Gets the vessel's roll angle (phi).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The roll angle in radians
 * @external
 */
export function getVesselRollAngle(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).phi;
}

/**
 * Gets the vessel's pitch angle (theta).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The pitch angle in radians
 * @external
 */
export function getVesselPitchAngle(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).theta;
}

// State access functions
/**
 * Gets the vessel's X position.
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The X position in meters
 * @external
 */
export function getVesselX(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).x;
}

/**
 * Gets the vessel's Y position.
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The Y position in meters
 * @external
 */
export function getVesselY(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).y;
}

/**
 * Gets the vessel's Z position.
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The Z position in meters
 * @external
 */
export function getVesselZ(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).z;
}

/**
 * Gets the vessel's heading (yaw/psi).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The heading in radians
 * @external
 */
export function getVesselHeading(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).psi;
}

/**
 * Gets the vessel's speed (magnitude of velocity).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The vessel's speed in m/s
 * @external
 */
export function getVesselSpeed(vesselPtr: usize): f64 {
  const vessel = changetype<VesselState>(vesselPtr);
  return Math.sqrt(vessel.u * vessel.u + vessel.v * vessel.v);
}

/**
 * Gets the vessel's engine RPM.
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The engine RPM
 * @external
 */
export function getVesselEngineRPM(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).engineRPM;
}

/**
 * Gets the vessel's fuel level (fraction 0.0 to 1.0).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The fuel level (0.0 to 1.0)
 * @external
 */
export function getVesselFuelLevel(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).fuelLevel;
}

/**
 * Gets the vessel's fuel consumption rate (kg/h).
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The fuel consumption rate in kg/h
 * @external
 */
export function getVesselFuelConsumption(vesselPtr: usize): f64 {
  return changetype<VesselState>(vesselPtr).fuelConsumption;
}

/**
 * Gets the vessel's metacentric height (GM), a measure of stability.
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The metacentric height (GM) in meters
 * @external
 */
export function getVesselGM(vesselPtr: usize): f64 {
  const vessel = changetype<VesselState>(vesselPtr);
  return calculateGM(vessel);
}

/**
 * Gets the vessel's center of gravity Y position.
 * @param vesselPtr - Pointer to the vessel instance
 * @returns The Y position of the center of gravity
 * @external
 */
export function getVesselCenterOfGravityY(vesselPtr: usize): f64 {
  const vessel = changetype<VesselState>(vesselPtr);
  return vessel.centerOfGravityY;
}
