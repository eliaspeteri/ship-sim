'use client';
// Constants for wave parameter calculation
// Amplitude
export const BASE_AMPLITUDE = 0.025;
export const AMPLITUDE_PER_SEASTATE = 1; // Reduced from 0.083 to make progression more gradual
export const MAX_AMPLITUDE = 12; // Increased from 1 to allow higher sea states

// Frequency
export const BASE_FREQUENCY = 1.07;
export const FREQUENCY_DROP_PER_SEASTATE = 1; //reduced from 5 to avoid hitting minimum too early
export const MIN_FREQUENCY = 0.003; // Lowered to allow more space for wave frequency changes

// Speed
export const BASE_SPEED = 0.2;
export const SPEED_PER_WINDSPEED = 0.05; // Reduced from 50 to make progression more reasonable
export const MAX_SPEED = 0.5; // Doubled to allow for higher sea states

// Persistence
export const BASE_PERSISTENCE = 0.1;
export const PERSISTENCE_PER_SEASTATE = 1;
export const MAX_PERSISTENCE = 0.25; // Slightly increased

// Lacunarity
export const BASE_LACUNARITY = 1.18;
export const LACUNARITY_PER_SEASTATE = 1;
export const MAX_LACUNARITY = 2.18;

// Peak threshold
export const BASE_PEAK_THRESHOLD = 0.08;
export const PEAK_THRESHOLD_PER_SEASTATE = 0.015; // Adjusted from 0.015
export const MAX_PEAK_THRESHOLD = 0.2; // Doubled to allow more whitecaps at higher sea states

// Trough threshold
export const BASE_TROUGH_THRESHOLD = -0.01;
export const TROUGH_THRESHOLD_PER_SEASTATE = -0.01; // Doubled from -0.005 for deeper troughs
export const MIN_TROUGH_THRESHOLD = -0.15; // Lowered to allow deeper wave troughs

// Smoothing speed
export const SMOOTHING_SPEED = 1.5;
