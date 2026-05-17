import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import type { Linter } from 'eslint';

const config: Linter.Config[] = [
  js.configs.recommended as Linter.Config,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', '.next/**', 'dist/**', '.pwcli/**', 'research/**', 'scripts/**'],
    languageOptions: {
      parser: tsParser as Linter.Parser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tsPlugin as never },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

export default config;
