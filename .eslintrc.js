module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "script",
  },
  plugins: [ "node" ],
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
  ],
  rules: {
    // Formatting consistency
    "semi": [ "warn", "always" ],
    "quotes": [ "warn", "double" ],
    "indent": [ "warn", 2, { "SwitchCase": 1 } ],
    "comma-dangle": [ "warn", "always-multiline" ],
    "eol-last": [ "warn", "always" ],
    "max-len": [
      "warn",
      {
        "code": 200,
        "ignoreComments": true,
        "ignoreStrings": true,
        "ignoreTemplateLiterals": true,
        "ignoreUrls": true,
      },
    ],
    "spaced-comment": [ "warn", "always" ],
    "object-curly-spacing": [ "warn", "always" ],
    "array-bracket-spacing": [ "warn", "always" ],
    "object-curly-newline": [ "warn", {
      "ImportDeclaration": { "multiline": true, "minProperties": 4 },
    } ],

    // Maintainability / backend safety
    "no-console": "off",
    "no-debugger": "warn",
    "no-unused-vars": [ "warn", {
      "args": "none",
      "ignoreRestSiblings": true,
    } ],
    "eqeqeq": [ "warn", "always", { "null": "ignore" } ],
    "curly": [ "warn", "multi-line", "consistent" ],
    "dot-notation": "warn",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-return-await": "warn",
    "no-throw-literal": "warn",
    "radix": "warn",

    // Node plugin rules: keep useful ones, avoid noisy legacy friction
    "node/no-deprecated-api": "warn",
    "node/no-missing-require": "error",
    "node/no-extraneous-require": "warn",
    "node/process-exit-as-throw": "warn",

    // Too noisy / legacy-unfriendly
    "node/no-unsupported-features/es-syntax": "off",
    "node/no-unpublished-require": "off",
    "node/no-unpublished-import": "off",
    "node/shebang": "off",
  },
  overrides: [
    {
      files: [ "*.js" ],
      rules: {
        "strict": [ "warn", "safe" ],
      },
    },
  ],
};
