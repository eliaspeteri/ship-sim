/**
 * Centralized configuration and constants for the ship simulator physics core.
 * Import this file wherever you need to use shared constants or magic numbers.
 *
 * AssemblyScript does not support runtime config file loading, so all values must be set at compile time.
 */

// Hydrodynamics factors

/**
 * Added mass and inertia factors are empirical multipliers used to approximate
 * the effect of the surrounding water on the vessel's dynamics. In ship hydrodynamics,
 * the vessel must accelerate not only its own mass but also some of the water around it (added mass).
 * These factors help stabilize the simulation and should be adjusted based on vessel geometry or literature values.
 */
export const ADDED_MASS_SURGE_FACTOR: f64 = 1.05;
export const ADDED_MASS_SWAY_FACTOR: f64 = 1.2;
export const ADDED_MASS_HEAVE_FACTOR: f64 = 1.1;
export const INERTIA_ROLL_FACTOR: f64 = 1.1;
export const INERTIA_PITCH_FACTOR: f64 = 1.1;
export const INERTIA_YAW_FACTOR: f64 = 1.2;

/**
 * Fallback values for vessel state recovery.
 * These are used to prevent division by zero or NaN propagation if vessel mass or total mass is invalid.
 */
export const FALLBACK_VESSEL_MASS: f64 = 1.0;
export const FALLBACK_CGZ_FACTOR: f64 = 0.5;

// Holtrop-Mennen model constants
export const HM_C1: f64 = 22231.05;
export const HM_C2: f64 = 2.0;
export const HM_C3: f64 = 0.5;
export const HM_C4: f64 = 0.15;

// Wave physics constants
export const WAVE_GRAVITY: f64 = 9.81;
export const WAVE_LENGTH_FACTOR: f64 = 1.5;
export const BEAUFORT_WAVE_HEIGHTS: f64[] = [
  0.0, 0.1, 0.2, 0.6, 1.0, 2.0, 3.0, 4.0, 5.5, 7.0, 9.0, 11.5, 14.0,
];
export const WAVE_RESISTANCE_COEFFICIENT: f64 = 500.0;
export const WAVE_RESISTANCE_NORMALIZATION: f64 = 100.0;

/**
 * Base value and slope for estimating wave period from sea state.
 * Used in calculateWaveLength.
 */
export const WAVE_PERIOD_BASE: f64 = 3.0;
export const WAVE_PERIOD_SLOPE: f64 = 1.6;

export const MAX_ENGINE_POWER: f64 = 2200000.0; // 2200 kW
export const PROPELLER_DIAMETER: f64 = 3.0; // 3.0 m
export const PROPELLER_GEAR_RATIO: f64 = 3.0;

/**
 * Fraction of the block coefficient used for wake fraction estimation.
 * Typical empirical value for merchant ships.
 */
export const PROPELLER_WAKE_FRACTION_FACTOR: f64 = 0.25;

/**
 * Small value to avoid division by zero in advance coefficient calculation.
 */
export const PROPELLER_ADVANCE_EPSILON: f64 = 0.001;

/**
 * Thrust coefficient intercept and slope for linear KT(J) approximation.
 * KT = intercept - slope * J
 */
export const PROPELLER_THRUST_COEFFICIENT_INTERCEPT: f64 = 1.0;
export const PROPELLER_THRUST_COEFFICIENT_SLOPE: f64 = 0.3;

export const GRAVITY = 9.81; // m/s^2
export const KINE_VISCOSITY = 0.000001187; // m²/s at 20°C

export const BLOCK_COEFFICIENT = 0.8; // Typical value for a ship
export const WATER_DENSITY = 1025; // kg/m³ for seawater
export const AIR_DENSITY = 1.225; // kg/m³ at sea level

export const RUDDER_ASPECT_RATIO: f64 = 1.8; // Aspect ratio for rudder hydrodynamics

export const RUDDER_AREA_COEFFICIENT: f64 = 0.018; // Coefficient for rudder area as a fraction of vessel length and draft

/**
 * Engine and fuel constants for diesel engine modeling
 */
export const ENGINE_TORQUE_CONVERSION: f64 = 9550.0; // Conversion factor for kW to Nm
export const ENGINE_PEAK_TORQUE_RPM_RATIO: f64 = 0.8; // Peak torque at 80% of max RPM
export const ENGINE_LOW_RPM_THRESHOLD: f64 = 0.1;
export const ENGINE_LOW_RPM_SLOPE: f64 = 5.0;
export const ENGINE_MID_RPM_INTERCEPT: f64 = 0.5;
export const ENGINE_MID_RPM_DIVISOR: f64 = 1.6;
export const ENGINE_HIGH_RPM_DIVISOR: f64 = 2.0;
export const ENGINE_EFFICIENCY: f64 = 0.8;

export const FUEL_SFC_BASE: f64 = 220.0; // g/kWh at optimal load
export const FUEL_SFC_MIN: f64 = 200.0; // g/kWh at best efficiency
export const FUEL_SFC_LOW_LOAD_SLOPE: f64 = 400.0;
export const FUEL_SFC_OPTIMAL_SLOPE: f64 = 20.0;
export const FUEL_SFC_HIGH_LOAD_SLOPE: f64 = 50.0;
export const FUEL_LOAD_OPTIMAL: f64 = 0.8;
export const FUEL_LOAD_LOW: f64 = 0.2;

/**
 * Coefficient for current force in X direction (base value).
 */
export const CURRENT_COEFFICIENT_X_BASE: f64 = 0.5;

/**
 * Coefficient for current force in X direction (cosine multiplier).
 */
export const CURRENT_COEFFICIENT_X_COS: f64 = 0.3;

/**
 * Coefficient for current force in Y direction (sine multiplier).
 */
export const CURRENT_COEFFICIENT_Y_SIN: f64 = 0.8;

/**
 * Coefficient for current yaw moment (sine of double angle multiplier).
 */
export const CURRENT_COEFFICIENT_N_SIN2: f64 = 0.1;

/**
 * Wetted area side multiplier for current force.
 */
export const WETTED_AREA_SIDE_MULTIPLIER: f64 = 0.7;
