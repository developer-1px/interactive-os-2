import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import noRawAriaRole from './eslint-rules/noRawAriaRole.js'

const localPlugin = {
  meta: { name: 'local' },
  rules: { 'no-raw-aria-role': noRawAriaRole },
}

export default defineConfig([
  globalIgnores(['dist', 'dist-lib', '.worktrees', '.claude/worktrees']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      'complexity': ['warn', { max: 10 }],
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    plugins: { local: localPlugin },
    rules: {
      'local/no-raw-aria-role': 'error',
    },
  },
  {
    // Widget registry files intentionally colocate multiple widgets + a registry export.
    // Test utility files colocate helper components with non-component exports.
    files: [
      '**/*Widgets.tsx',
      'src/interactive-os/__tests__/clipboardTestUtils.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
