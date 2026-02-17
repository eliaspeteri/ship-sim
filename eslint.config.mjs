import v8 from 'node:v8';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
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
  'plugin:react-hooks/recommended',
  'plugin:import/recommended',
  'plugin:import/typescript',
  'prettier',
);
const tsTypeCheckedConfigs = compat
  .extends('plugin:@typescript-eslint/recommended-type-checked')
  .map(config => ({
    ...config,
    files: ['src/server/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
  }));
const CSS_MODULE_IMPORT_PATTERNS = ['*.module.css', '**/*.module.css'];

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
  ...tsTypeCheckedConfigs,

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
      '**/generated/prisma/**',
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
        ...globals.es2021,
        ...globals.browser,
        ...globals.node,
        NodeJS: 'readonly',
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
    plugins: {
      'unused-imports': unusedImports,
    },
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
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Default off to avoid noise in R3F/Three-heavy JSX.
      'react/no-unknown-property': 'off',

      // React 17+ doesn't require React to be in scope
      'react/react-in-jsx-scope': 'off',

      // Temporarily disable prop-types validation since you're using TypeScript
      'react/prop-types': 'off',

      // These class-component-focused rules are expensive and low value for this TS codebase.
      'react/no-direct-mutation-state': 'off',
      'react/display-name': 'off',
      'react/require-render-return': 'off',

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

      // Keep control flow and signatures readable by default.
      'max-depth': ['warn', 3],
      'max-params': ['warn', 3],
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'warn',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^geojson$', '^\\.\\./types/wasm$', '^node:'],
        },
      ],

      // Async safety
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',

      // Type/import hygiene
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 6,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // Module hygiene
      'import/no-cycle': 'warn',
      'import/no-unused-modules': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // Safer iteration semantics over plain for..in.
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'ForInStatement',
          message:
            'Avoid for..in due to prototype-chain iteration risk; use Object.keys/Object.entries instead.',
        },
      ],

      // Tailwind-first guardrail: avoid new CSS module imports.
      'no-restricted-imports': [
        'error',
        {
          patterns: CSS_MODULE_IMPORT_PATTERNS,
        },
      ],
    },
  },

  // Keep server runtime/domain modules independent from client UI/page modules.
  {
    files: ['src/server/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...CSS_MODULE_IMPORT_PATTERNS,
            '**/components/**',
            '**/pages/**',
          ],
        },
      ],
    },
  },

  // Prevent client runtime layers from directly importing server internals.
  {
    files: [
      'src/components/**/*.{js,jsx,ts,tsx}',
      'src/features/**/*.{js,jsx,ts,tsx}',
      'src/networking/**/*.{js,jsx,ts,tsx}',
      'src/simulation/**/*.{js,jsx,ts,tsx}',
      'src/store/**/*.{js,jsx,ts,tsx}',
      'src/pages/**/*.{js,jsx,ts,tsx}',
    ],
    ignores: ['src/pages/api/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...CSS_MODULE_IMPORT_PATTERNS, '**/server/**'],
        },
      ],
    },
  },

  // Temporary exception: shared store type currently depends on server role type.
  {
    files: ['src/store/types.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: CSS_MODULE_IMPORT_PATTERNS,
        },
      ],
    },
  },

  // Interop boundaries may require wider signatures (ABI/event contracts).
  {
    files: ['src/lib/wasmBridge.ts', 'src/lib/customWasmLoader.ts'],
    rules: {
      'max-params': 'off',
    },
  },

  // Ratchet strict async/condition safety in backend/core utility code first.
  {
    files: ['src/server/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 6,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowNullableBoolean: true,
          allowNullableString: false,
          allowNullableNumber: false,
          allowNullableObject: true,
          allowNumber: false,
          allowString: false,
        },
      ],
    },
  },

  // Type-aware linting is expensive; scope it to TS files.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
    },
  },

  // Playwright specs are not part of the TS project service graph.
  {
    files: ['tests/playwright/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },

  // Legacy architecture: known cyclic graph across simulation/store/socket and server runtime modules.
  // Keep rule enabled globally, but suppress in these hotspots until larger refactors land.
  {
    files: [
      'src/lib/wasmLoader.ts',
      'src/networking/adapters/socketStoreAdapter.ts',
      'src/networking/socket.ts',
      'src/networking/socket/simulationHandlers.ts',
      'src/simulation/index.ts',
      'src/simulation/simulationLoop.ts',
      'src/store/index.ts',
      'src/store/slices/vesselSlice.ts',
      'src/server/api.ts',
      'src/server/economy.ts',
      'src/server/index.ts',
      'src/server/logistics.ts',
      'src/server/missions.ts',
      'src/server/routes/economyRoutes.ts',
      'src/server/runtime/serverRuntime.ts',
      'src/server/socketHandlers/adminWeather.ts',
      'src/server/socketHandlers/cargo.ts',
      'src/server/socketHandlers/economy.ts',
      'src/server/socketHandlers/userMode.ts',
      'src/server/socketHandlers/vesselJoin.ts',
      'src/server/socketHandlers/vesselRepair.ts',
      'src/server/socketHandlers/vesselSale.ts',
      'src/server/socketHandlers/vesselStorage.ts',
      'src/server/weatherSystem.ts',
    ],
    rules: {
      'import/no-cycle': 'off',
    },
  },

  // Enable DOM property checks only in convention-based, DOM-focused areas.
  {
    files: [
      'src/features/{auth,economy,profile,sim,vessels}/**/*.{js,jsx,ts,tsx}',
      'src/pages/**/*.{js,jsx,ts,tsx}',
      'src/components/{alarms,bridge,common,communication,dials,hud,navigation,radar,radio,schematic,switches}/**/*.{js,jsx,ts,tsx}',
    ],
    ignores: [
      'src/features/editor/**/*.{js,jsx,ts,tsx}',
      'src/pages/globe.tsx',
      'src/pages/physics-debug.tsx',
    ],
    rules: {
      'react/no-unknown-property': 'error',
    },
  },

  // Test files config
  {
    files: ['**/tests/**/*.{js,mjs,ts,tsx,cjs}'],
    rules: {
      'no-console': 'off', // Allow console in test files
      'no-undef': 'off', // Disable no-undef for test globals
      '@typescript-eslint/no-require-imports': 'off', // Allow require in tests
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          fixToUnknown: false,
          ignoreRestArgs: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 6,
        },
      ],
      'max-depth': 'off',
      'max-params': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'import/no-cycle': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^node:'],
        },
      ],
      'no-implicit-coercion': 'off',
      eqeqeq: 'off',
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
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
        ...globals.browser,
      },
    },
  },

  // Node-specific config
  {
    files: ['**/server/**/*.{js,jsx,ts,tsx}', '*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'writable',
        NodeJS: 'readonly',
      },
    },
  },
];
