// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Scripts de Node (no forman parte de la app)
    files: ['scripts/**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: { __dirname: 'readonly', __filename: 'readonly', require: 'readonly', module: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },
]);
