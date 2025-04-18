export default {
  reactStrictMode: true,
  transpilePackages: ['three'],
  images: {
    domains: ['example.com'],
  },
  env: {
    CUSTOM_ENV_VARIABLE: process.env.CUSTOM_ENV_VARIABLE,
  },
  webpack: config => {
    return config;
  },
};
