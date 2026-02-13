export type UserSettings = {
  id: number;
  userId: string;
  soundEnabled: boolean;
  units: 'metric' | 'imperial' | 'nautical';
  speedUnit: 'knots' | 'kmh' | 'mph';
  distanceUnit: 'nm' | 'km' | 'mi';
  timeZoneMode: 'auto' | 'manual';
  timeZone: string;
  notificationLevel: 'all' | 'mentions' | 'none';
  interfaceDensity: 'comfortable' | 'compact';
  createdAt: Date;
  updatedAt: Date;
};

export type UserSettingsStore = {
  get: (userId: string) => UserSettings | undefined;
  set: (userId: string, settings: UserSettings) => void;
};

export const createInMemoryUserSettingsStore = (): UserSettingsStore => {
  const storage: Record<string, UserSettings> = {};
  return {
    get: userId => storage[userId],
    set: (userId, settings) => {
      storage[userId] = settings;
    },
  };
};
