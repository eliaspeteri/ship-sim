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

  // Global ignores for all configurations
  {
    ignores: [
      '**/.next/**',
      '**/build/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/public/**',
      '**/.vercel/**',
      '**/assembly/**', // Ignore AssemblyScript files
      '**/scripts/**', // Ignore scripts directory
    ],
  },

  // Global language options
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Browser globals
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        WebAssembly: 'readonly',
        performance: 'readonly',
        fetch: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        MouseEvent: 'readonly',
        HTMLDivElement: 'readonly',
        NodeJS: 'readonly', // Added NodeJS global
        Buffer: 'readonly', // Added Buffer global
        URLSearchParams: 'readonly', // Added URLSearchParams global
        Event: 'readonly', // Added Event global
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

      // Allow any type with a todo comment
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          fixToUnknown: false,
          ignoreRestArgs: true,
        },
      ],

      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Allow Three.js props in React components
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'position',
            'rotation',
            'args',
            'object',
            'intensity',
            'castShadow',
            'receiveShadow',
            'attach',
            'map',
            'roughness',
            'metalness',
            'emissive',
            'emissiveIntensity',
            'roughnessMap',
            'geometry',
            'transparent',
            'alphaTest',
            'depthWrite',
            'visible',
            'shadow-mapSize',
            'attach',
            'args',
            'jsx',
          ],
        },
      ],

      // React 17+ doesn't require React to be in scope
      'react/react-in-jsx-scope': 'off',

      // Temporarily disable prop-types validation since you're using TypeScript
      'react/prop-types': 'off',

      // Allow aliasing this to self/that in specific cases
      '@typescript-eslint/no-this-alias': [
        'error',
        {
          allowDestructuring: true,
          allowedNames: ['self', 'that'],
        },
      ],

      // Allow console methods selectively
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // Allow usage of common globals
      'no-undef': 'error',
    },
  },

  // Test files config
  {
    files: ['**/tests/**/*.{js,ts}'],
    rules: {
      'no-console': 'off', // Allow console in test files
    },
    languageOptions: {
      globals: {
        console: 'readonly',
      },
    },
  },

  // Browser-specific config
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/server/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
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
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
        // Add other Node.js globals as needed
      },
    },
  },
];
