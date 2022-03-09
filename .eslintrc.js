module.exports = {
  env: {
    'jest/globals': true,
  },
  extends: [
    '@tencent/eslint-config-tencent',
    'eslint:recommended',
  ],
  // parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {},
  plugins: ['jest'],
};
