import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.{ts,tsx}"],
    ignores: ["app/backend/adapters/**", "app/engine/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/engine/core/**",
                "@/app/engine/agents/**",
                "@/app/engine/strategy/**",
                "@/app/engine/alerts/**",
                "**/app/engine/core/**",
                "**/app/engine/agents/**",
                "**/app/engine/strategy/**",
                "**/app/engine/alerts/**",
                "../engine/core/**",
                "../engine/agents/**",
                "../engine/strategy/**",
                "../engine/alerts/**",
                "../../engine/core/**",
                "../../engine/agents/**",
                "../../engine/strategy/**",
                "../../engine/alerts/**",
                "../../../engine/core/**",
                "../../../engine/agents/**",
                "../../../engine/strategy/**",
                "../../../engine/alerts/**"
              ],
              message:
                "Direct Trading Engine imports are forbidden here. Use the backend facade in app/backend/runtime.ts.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
