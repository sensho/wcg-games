module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: false,
    node: true,
  },
  extends: [
    "standard",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
};
