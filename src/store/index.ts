import { create } from 'zustand';

interface SimulationState {
  // Define your state properties here
  isRunning: boolean;
  setRunning: (running: boolean) => void;
  // Add more state properties and methods as needed
}

const useStore = create<SimulationState>(set => ({
  isRunning: false,
  setRunning: running => set({ isRunning: running }),
  // Initialize more state properties and methods here
}));

export default useStore;
