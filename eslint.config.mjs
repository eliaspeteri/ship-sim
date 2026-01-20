import v8 from 'node:v8';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Provide structuredClone for older Node versions
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = value => v8.deserialize(v8.serialize(value));
}

// Polyfill AbortSignal.throwIfAborted for older Node
if (
  typeof globalThis.AbortSignal !== 'undefined' &&
  !globalThis.AbortSignal.prototype.throwIfAborted
) {
  globalThis.AbortSignal.prototype.throwIfAborted = function throwIfAborted() {
    if (this.aborted) {
      const error = new Error('This operation was aborted');
      error.name = 'AbortError';
      throw error;
    }
  };
}

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
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
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
      '**/next-env.d.ts', // Ignore Next.js generated types file
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
        alert: 'readonly',
        ImageData: 'readonly',
        MouseEvent: 'readonly',
        PointerEvent: 'readonly',
        WheelEvent: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        SVGSVGElement: 'readonly',
        NodeJS: 'readonly', // Added NodeJS global
        Buffer: 'readonly', // Added Buffer global
        URLSearchParams: 'readonly', // Added URLSearchParams global
        Event: 'readonly', // Added Event global
        createImageBitmap: 'readonly', // Added createImageBitmap global
        OffscreenCanvas: 'readonly', // Added OffscreenCanvas global
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
            'material',
            'frustumCulled',
            'renderOrder',
            'distance',
            'decay',
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
    files: ['**/tests/**/*.{js,ts,tsx,cjs}'],
    rules: {
      'no-console': 'off', // Allow console in test files
      'no-undef': 'off', // Disable no-undef for test globals
      '@typescript-eslint/no-require-imports': 'off', // Allow require in tests
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        require: 'readonly',
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
        AbortController: 'readonly',
        createImageBitmap: 'readonly',
        OffscreenCanvas: 'readonly',
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
      },
    },
  },
];
