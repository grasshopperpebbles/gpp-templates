/**
 * ESLint 8 config for `npm run lint` (`eslint src --ext .ts`).
 * Parser and rules come from @typescript-eslint (both in devDependencies).
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, es2022: true },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
  rules: {
    // `declare global { namespace Express { ... } }` is how Request is extended.
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    // Express needs all four parameters on an error handler, so `_next` stays unused.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Shown, not fatal: the error handler and validation middleware still use `any`.
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
