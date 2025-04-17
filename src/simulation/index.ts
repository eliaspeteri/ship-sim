// This file manages the simulation scenarios and state transitions.

import { createStore } from 'zustand';

interface SimulationState {
    isRunning: boolean;
    currentScenario: string;
    startSimulation: (scenario: string) => void;
    stopSimulation: () => void;
}

export const useSimulationStore = createStore<SimulationState>((set) => ({
    isRunning: false,
    currentScenario: '',
    startSimulation: (scenario) => set({ isRunning: true, currentScenario: scenario }),
    stopSimulation: () => set({ isRunning: false, currentScenario: '' }),
}));

export const runScenario = (scenario: string) => {
    const { startSimulation } = useSimulationStore.getState();
    startSimulation(scenario);
};

export const stopScenario = () => {
    const { stopSimulation } = useSimulationStore.getState();
    stopSimulation();
};