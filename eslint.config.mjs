import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      'next-env.d.ts',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Plain JS config files run in Node.
    files: ['**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', URL: 'readonly' } },
  },
  {
    // packages/core is framework-agnostic and packages/player/src/logic is headless.
    files: ['packages/core/**/*.{ts,tsx}', 'packages/player/src/logic/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['next', 'next/*', 'react', 'react-dom', 'react/*'] },
      ],
    },
  },
);
