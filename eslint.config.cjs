// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const pluginJs = require("@eslint/js");
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const tseslint = require("typescript-eslint");
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const { defineConfig } = require("eslint/config");

/** @type {import('eslint').Linter.Config[]} */
module.exports = defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
  },
  {
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        scrollTo: "readonly",
        clearTimeout: "readonly",
        setTimeout: "readonly",
        alert: "readonly",
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      // disable the core rule (the TS plugin provides the replacement)
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          caughtErrors: "all",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^(?:_|e)$", // ignore only exact `_` for variables
          argsIgnorePattern: "^(?:_|e)$", // ignore only exact `_` for function args
          caughtErrorsIgnorePattern: "^(?:_|e)$", // <-- ignore only exact `_` for catch (_)
          destructuredArrayIgnorePattern: "^(?:_|e)$", // ignore only exact `_` in destructured arrays
        },
      ],
    },
  },
]);
