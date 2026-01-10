export default {
  allowedDevOrigins: ['http://localhost:3000', '192.168.1.220'],
  reactStrictMode: true,
  transpilePackages: ['three'],
  images: {
    domains: ['example.com'],
  },
  env: {
    CUSTOM_ENV_VARIABLE: process.env.CUSTOM_ENV_VARIABLE,
  },
  // Enable standalone output mode for Docker deployment
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: config => {
    // WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add a rule to handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[hash][ext]',
      },
    });

    // Exclude WebAssembly files from other loaders
    config.module.rules.forEach(rule => {
      if (rule.test && rule.test.toString().includes('js')) {
        rule.exclude = [...(rule.exclude || []), /\.wasm$/];
      }
    });

    // Don't attempt to parse WebAssembly files
    config.module.noParse = [...(config.module.noParse || []), /\.wasm$/];

    // Add rule for shader files (.vert, .frag, etc.)
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });

    return config;
  },
};
