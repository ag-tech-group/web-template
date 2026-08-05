// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import { RuleTester } from "eslint"
import { logicalDirectionClasses } from "./logical-direction-classes.js"

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

ruleTester.run("logical-direction-classes", logicalDirectionClasses, {
  valid: [
    // Already logical.
    '<div className="ms-4 pe-2 text-start border-s rounded-e-md" />',
    '<div className="-start-4 md:end-0" />',

    // Direction-neutral: the inline axis follows `dir` on its own.
    '<div className="flex items-center justify-between gap-4" />',
    '<div className="col-start-2 justify-self-end self-start" />',
    // Logical since Tailwind v4 (margin-inline-*, border-inline-*-width).
    '<div className="space-x-4 divide-x" />',
    // Symmetric, so mirroring is a no-op.
    '<div className="inset-x-0 top-0" />',

    // Colour and animation utilities that merely *contain* a direction word.
    'cn("border-ring border-red-500 border-lime-500")',
    '<div className="data-[side=left]:slide-in-from-right-2" />',
    '<div className="origin-top translate-y-2" />',

    // Not a class position.
    'const path = "/pr-review/ml-4"',
    '<a title="text-left" href="/left-2" />',
  ],

  invalid: [
    {
      code: '<div className="ml-4 mr-2" />',
      output: '<div className="ms-4 me-2" />',
      errors: 1,
    },
    {
      code: '<div className="md:hover:pr-2 -left-4" />',
      output: '<div className="md:hover:pe-2 -start-4" />',
      errors: 1,
    },
    {
      code: 'cn("text-left border-l rounded-tr-md scroll-pl-6")',
      output: 'cn("text-start border-s rounded-se-md scroll-ps-6")',
      errors: 1,
    },
    {
      // Arbitrary variants must survive the rewrite untouched.
      code: 'cn("[&:not(:last-child)]:ml-2 [&_svg]:right-0")',
      output: 'cn("[&:not(:last-child)]:ms-2 [&_svg]:end-0")',
      errors: 1,
    },
    {
      // Nested inside a cva() variant map, not a JSX attribute.
      code: 'cva("base", { variants: { size: { sm: "pl-2 float-right" } } })',
      output: 'cva("base", { variants: { size: { sm: "ps-2 float-end" } } })',
      errors: 1,
    },
    {
      code: "const c = <div className={`flex ${gap} mr-2`} />",
      output: "const c = <div className={`flex ${gap} me-2`} />",
      errors: 1,
    },
  ],
})
