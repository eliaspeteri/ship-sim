const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const next = Number.parseInt(value || '', 10);
  return Number.isFinite(next) && next > 0 ? next : fallback;
};

export const COMPILE_LIMITS = {
  maxLayers: 20,
  maxTiles: 256,
  maxArtifacts: 2048,
  maxPayloadBytes: 256 * 1024,
  rateLimit: {
    windowMs: parsePositiveInt(
      process.env.COMPILE_RATE_LIMIT_WINDOW_MS,
      60_000,
    ),
    max: parsePositiveInt(process.env.COMPILE_RATE_LIMIT_MAX, 20),
  },
};

export const REGISTER_LIMITS = {
  maxUsernameLength: 32,
  maxPasswordLength: 128,
  rateLimit: {
    windowMs: parsePositiveInt(
      process.env.REGISTER_RATE_LIMIT_WINDOW_MS,
      10 * 60_000,
    ),
    max: parsePositiveInt(process.env.REGISTER_RATE_LIMIT_MAX, 5),
  },
};
