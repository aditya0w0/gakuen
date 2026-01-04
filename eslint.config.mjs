import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Global rule overrides
  {
    rules: {
      // Allow any in codebase - prefer unknown but don't block CI for it
      "@typescript-eslint/no-explicit-any": "warn",
      // no-img-element is a suggestion, not a requirement
      "@next/next/no-img-element": "warn",
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "off",
      // Disable setState in effect rule - false positives for hydration guards
      "react-hooks/set-state-in-effect": "off",
      // Disable impure function rule - Date.now() in handlers is fine
      "react/no-unstable-default-props": "off",
    },
  },
  // Completely disable some rules for test files and Node.js scripts
  {
    files: ["**/__tests__/**/*", "**/*.test.ts", "**/*.test.tsx", "**/scripts/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
