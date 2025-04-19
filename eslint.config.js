import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Mimic CommonJS variables -- needed for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create compat instance
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Plugins and configurations using the compatibility layer
const pluginConfigs = compat.extends(
  'plugin:react/recommended',
  'plugin:@typescript-eslint/recommended',
  'prettier',
);

export default [
  // Default ESLint config
  js.configs.recommended,

  // Add plugin configurations
  ...pluginConfigs,

  // Global language options
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // Base config for all files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Your custom rules here
    },
  },

  // Browser-specific config
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/server/**'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // Add other browser globals as needed
      },
    },
  },

  // Node-specific config
  {
    files: ['**/server/**/*.{js,jsx,ts,tsx}', '*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'writable',
        // Add other Node.js globals as needed
      },
    },
  },
];
