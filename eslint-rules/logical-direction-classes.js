// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

/**
 * Requires logical (start/end) Tailwind direction utilities instead of physical
 * (left/right) ones, so a consuming app can switch `<html dir>` to `rtl` and
 * have the layout mirror without auditing every className in the tree.
 *
 * Only utilities with a true logical equivalent are reported, and every report
 * is autofixable — `translate-x-*` and `origin-left` have no logical form in
 * Tailwind and are deliberately left alone (they need an `rtl:` variant).
 * `space-x-*` and `divide-x-*` already compile to `margin-inline-*` and
 * `border-inline-*-width` under Tailwind v4, so they are not physical either.
 */

/** Physical utilities that carry a value segment, e.g. `ml-4`, `border-l-2`. */
const PREFIX_MAP = {
  ml: "ms",
  mr: "me",
  pl: "ps",
  pr: "pe",
  left: "start",
  right: "end",
  "border-l": "border-s",
  "border-r": "border-e",
  "rounded-l": "rounded-s",
  "rounded-r": "rounded-e",
  "rounded-tl": "rounded-ss",
  "rounded-tr": "rounded-se",
  "rounded-bl": "rounded-es",
  "rounded-br": "rounded-ee",
  "scroll-ml": "scroll-ms",
  "scroll-mr": "scroll-me",
  "scroll-pl": "scroll-ps",
  "scroll-pr": "scroll-pe",
}

/** Physical utilities with no value segment, e.g. `text-left`. */
const EXACT_MAP = {
  "text-left": "text-start",
  "text-right": "text-end",
  "float-left": "float-start",
  "float-right": "float-end",
  "clear-left": "clear-start",
  "clear-right": "clear-end",
}

// Longest first, so a more specific prefix always wins over a shorter one.
const PREFIXES = Object.keys(PREFIX_MAP).sort((a, b) => b.length - a.length)

const CLASS_ATTRIBUTES = new Set(["className", "class"])
const CLASS_BUILDERS = new Set([
  "cn",
  "clsx",
  "classNames",
  "cva",
  "twMerge",
  "twJoin",
])

// A class token is a whitespace-delimited run. Quotes, backticks and braces are
// excluded so the literal's own delimiters (and `${`/`}` in a template) never
// end up glued to the front of a token and defeat the prefix match.
const TOKEN = /[^\s"'`{}]+/g

/**
 * Splits `md:hover:ml-4` into `["md:hover:", "ml-4"]`. Only a colon at bracket
 * depth 0 separates a variant from the utility — `[&:not(:last-child)]:ml-2`
 * has three colons but just one separator.
 */
function splitVariants(token) {
  let depth = 0
  let separator = -1
  for (let i = 0; i < token.length; i++) {
    const char = token[i]
    if (char === "[" || char === "(") depth++
    else if (char === "]" || char === ")") depth--
    else if (char === ":" && depth === 0) separator = i
  }
  return [token.slice(0, separator + 1), token.slice(separator + 1)]
}

/** Returns the logical form of a class token, or null if it has none. */
function toLogical(token) {
  const [variants, utility] = splitVariants(token)
  const negative = utility.startsWith("-")
  const base = negative ? utility.slice(1) : utility
  const prefix = negative ? `${variants}-` : variants

  if (EXACT_MAP[base]) return prefix + EXACT_MAP[base]

  for (const physical of PREFIXES) {
    // A bare `border-l` is valid; `border-lime-500` must not match, hence the
    // exact-or-followed-by-hyphen test rather than a plain `startsWith`.
    if (base === physical) return prefix + PREFIX_MAP[physical]
    if (base.startsWith(`${physical}-`)) {
      return prefix + PREFIX_MAP[physical] + base.slice(physical.length)
    }
  }
  return null
}

/** @type {import("eslint").Rule.RuleModule} */
export const logicalDirectionClasses = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require logical (start/end) Tailwind direction utilities over physical (left/right) ones",
    },
    fixable: "code",
    schema: [],
    messages: {
      physical:
        'Physical direction utility does not mirror under `dir="rtl"`. Use the logical form: {{replacements}}.',
    },
  },

  create(context) {
    const { sourceCode } = context

    // Scoped to class-bearing positions so an ordinary string that happens to
    // contain `pr-` or `ml-` (a URL, a test id) is never touched.
    function isClassContext(node) {
      return sourceCode
        .getAncestors(node)
        .some(
          (ancestor) =>
            (ancestor.type === "JSXAttribute" &&
              ancestor.name.type === "JSXIdentifier" &&
              CLASS_ATTRIBUTES.has(ancestor.name.name)) ||
            (ancestor.type === "CallExpression" &&
              ancestor.callee.type === "Identifier" &&
              CLASS_BUILDERS.has(ancestor.callee.name))
        )
    }

    // Rewrites the node's own source text, so the replacement range is
    // self-consistent whether or not the node's range covers its delimiters.
    function check(node) {
      const replacements = []
      const fixed = sourceCode.getText(node).replace(TOKEN, (token) => {
        const logical = toLogical(token)
        if (!logical) return token
        replacements.push(`${token} → ${logical}`)
        return logical
      })

      if (replacements.length === 0) return

      context.report({
        node,
        messageId: "physical",
        data: { replacements: replacements.join(", ") },
        fix: (fixer) => fixer.replaceText(node, fixed),
      })
    }

    return {
      Literal(node) {
        if (typeof node.value === "string" && isClassContext(node)) check(node)
      },
      TemplateElement(node) {
        if (isClassContext(node)) check(node)
      },
    }
  },
}

export default logicalDirectionClasses
