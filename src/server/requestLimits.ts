export const COMPILE_LIMITS = {
  maxLayers: 20,
  maxTiles: 256,
  maxArtifacts: 2048,
  maxPayloadBytes: 256 * 1024,
  rateLimit: {
    windowMs: 60_000,
    max: 20,
  },
};

export const REGISTER_LIMITS = {
  maxUsernameLength: 32,
  maxPasswordLength: 128,
  rateLimit: {
    windowMs: 10 * 60_000,
    max: 5,
  },
};
