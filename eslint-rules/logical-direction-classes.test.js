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

/** Shorthand for the one message this rule emits. */
const err = (physical, logical) => ({
  messageId: "physical",
  data: { physical, logical },
})

ruleTester.run("logical-direction-classes", logicalDirectionClasses, {
  valid: [
    // Already logical.
    '<div className="ms-4 pe-2 text-start border-s rounded-e-md" />',
    '<div className="-start-4 md:end-0 scroll-ps-6" />',

    // Direction-neutral: the inline axis follows `dir` on its own.
    '<div className="flex items-center justify-between gap-4" />',
    '<div className="col-start-2 justify-self-end self-start" />',
    // Logical since Tailwind v4 (margin-inline-*, border-inline-*-width).
    '<div className="space-x-4 divide-x" />',
    // Symmetric, so mirroring is a no-op.
    '<div className="inset-x-0 top-0" />',

    // Colour and animation utilities that merely *contain* a direction word.
    'cn("border-ring border-red-500 border-lime-500 rounded-lg")',
    '<div className="data-[side=left]:slide-in-from-right-2" />',
    '<div className="origin-top translate-x-2" />',

    // Not a class position at all.
    'const path = "/pr-review/ml-4"',
    '<a title="text-left" href="/left-2" />',

    // Bare `left`/`right`/`ml` are not Tailwind classes, so a token that
    // matches one exactly is some other kind of string. This is the shadcn
    // `sheet.tsx` shape — rewriting the discriminant would silently drop the
    // whole className branch.
    'cn("fixed", side === "right" && "inset-y-0 end-0", side === "left" && "inset-y-0 start-0")',
    'cva("x", { variants: { align: { left: "text-start" } }, defaultVariants: { align: "left" } })',
    // ISO-639 codes collide head-on with the prefix keys (ml, pl, mr, pr).
    'cn(locale === "ml" && "font-a", locale === "pl" && "font-b")',

    // Strings that have left class-composition context.
    'cn("p-2", someFn("pr-review"))',
    'cn("p-2", styles["left-panel"])',
    'cn("p-2", t("mr-title"))',
    // clsx object syntax: the key is the class, and it is already logical.
    '<div className={cn({ "ms-4": isActive })} />',

    // Inherited Object.prototype keys must not resolve as a mapping.
    'cn("constructor toString hasOwnProperty valueOf")',
  ],

  invalid: [
    {
      code: '<div className="ml-4 mr-2" />',
      errors: [err("ml-4", "ms-4"), err("mr-2", "me-2")],
    },
    {
      code: '<div className="pl-8 pr-2 text-left" />',
      errors: [
        err("pl-8", "ps-8"),
        err("pr-2", "pe-2"),
        err("text-left", "text-start"),
      ],
    },
    {
      // Variant prefix and negative sign, together and apart.
      code: '<div className="md:hover:pr-2 -left-4 md:-ml-4" />',
      errors: [
        err("md:hover:pr-2", "md:hover:pe-2"),
        err("-left-4", "-start-4"),
        err("md:-ml-4", "md:-ms-4"),
      ],
    },
    {
      // Leading `!` important modifier, still valid in v4.
      code: '<div className="!ml-4 !text-left md:!pr-2" />',
      errors: [
        err("!ml-4", "!ms-4"),
        err("!text-left", "!text-start"),
        err("md:!pr-2", "md:!pe-2"),
      ],
    },
    {
      // All four corners — the mapping most likely to be wrong by inspection.
      code: 'cn("rounded-tl rounded-tr-md rounded-bl-sm rounded-br")',
      errors: [
        err("rounded-tl", "rounded-ss"),
        err("rounded-tr-md", "rounded-se-md"),
        err("rounded-bl-sm", "rounded-es-sm"),
        err("rounded-br", "rounded-ee"),
      ],
    },
    {
      // Bare and valued forms of the same prefix.
      code: 'cn("border-l border-r-2 float-right clear-left scroll-pl-6")',
      errors: [
        err("border-l", "border-s"),
        err("border-r-2", "border-e-2"),
        err("float-right", "float-end"),
        err("clear-left", "clear-start"),
        err("scroll-pl-6", "scroll-ps-6"),
      ],
    },
    {
      // Arbitrary variants must survive the report unmangled.
      code: 'cn("[&:not(:last-child)]:ml-2 [&_svg]:right-0 supports-[display:grid]:pl-1")',
      errors: [
        err("[&:not(:last-child)]:ml-2", "[&:not(:last-child)]:ms-2"),
        err("[&_svg]:right-0", "[&_svg]:end-0"),
        err("supports-[display:grid]:pl-1", "supports-[display:grid]:ps-1"),
      ],
    },
    {
      // Arbitrary value, and a conditional inside a builder call.
      code: 'cn(active ? "ml-[calc(100%-1rem)]" : "mr-auto")',
      errors: [
        err("ml-[calc(100%-1rem)]", "ms-[calc(100%-1rem)]"),
        err("mr-auto", "me-auto"),
      ],
    },
    {
      // Nested in a cva() variant map, not a JSX attribute.
      code: 'cva("base", { variants: { size: { sm: "pl-2 float-right" } } })',
      errors: [err("pl-2", "ps-2"), err("float-right", "float-end")],
    },
    {
      code: "const c = <div className={`flex ${gap} mr-2`} />",
      errors: [err("mr-2", "me-2")],
    },
    {
      // clsx object syntax puts the class name in the key.
      code: '<div className={cn({ "ml-4": isActive })} />',
      errors: [err("ml-4", "ms-4")],
    },
  ],
})
