// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { logicalDirectionClasses } from "./eslint-rules/logical-direction-classes.js"

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      local: {
        rules: { "logical-direction-classes": logicalDirectionClasses },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Keeps the tree RTL-ready: physical direction utilities (`ml-`, `pr-`,
      // `text-left`) don't mirror under `dir="rtl"`. Autofixable —
      // `pnpm lint --fix` after `shadcn add`, which writes physical utilities.
      "local/logical-direction-classes": "error",
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "useTheme",
            "useAuth",
            "useAnalytics",
            "useFeatureFlag",
            "useInvalidateFeatureFlags",
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/test/**/*.{ts,tsx}",
      "src/components/ui/**/*.{ts,tsx}",
      "src/main.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  }
)
