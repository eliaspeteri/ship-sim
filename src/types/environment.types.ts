export interface EnvironmentState {
  wind: {
    speed: number;
    direction: number;
    gusting: boolean;
    gustFactor: number;
  };
  current: {
    speed: number;
    direction: number;
    variability: number;
  };
  seaState: number;
  waterDepth?: number;
  /**
   * EnvironmentState
   *
   * This interface represents the environmental state as used by the client.
   *
   * Contract:
   * - The server provides only raw weather/environmental data (wind, seaState, etc.).
   * - The client uses the WASM module to compute derived values (waveHeight, waveLength, etc.).
   * - waveHeight is NOT sent by the server; it is calculated on the client.
   */
  waveHeight?: number;
  waveDirection?: number;
  waveLength?: number;
  visibility?: number;
  timeOfDay: number;
  precipitation?: 'none' | 'rain' | 'snow' | 'fog';
  precipitationIntensity?: number;
  name?: string;
}
