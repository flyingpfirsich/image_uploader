import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'data/**',
      'uploads/**',
      'drizzle/**',
      'vitest.config.ts',
      '**/*.test.ts',
      '**/test/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Main source files - with type-aware linting
  {
    files: ['**/*.ts'],
    ignores: ['**/*.test.ts', '**/test/**', 'dist/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.json',
      },
    },
    rules: {
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // Express error handlers require 4 params even if not all used
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  }
);
