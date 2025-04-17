// This file exports TypeScript types and interfaces used throughout the application.

export interface Vessel {
    id: string;
    name: string;
    type: string;
    length: number;
    width: number;
    draft: number;
    displacement: number;
}

export interface Engine {
    id: string;
    type: string;
    power: number; // in kW
    fuelType: string;
}

export interface SimulationState {
    time: number; // in seconds
    vessel: Vessel;
    engine: Engine;
    windSpeed: number; // in knots
    waveHeight: number; // in meters
    currentSpeed: number; // in knots
}

export interface UserSettings {
    language: string;
    theme: 'light' | 'dark';
}

export interface SimulationScenario {
    id: string;
    name: string;
    description: string;
    initialState: SimulationState;
}