// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

/**
 * Reports physical (left/right) Tailwind direction utilities and names the
 * logical (start/end) equivalent, so a consuming app can switch `<html dir>`
 * to `rtl` and have the layout mirror.
 *
 * Deliberately not autofixable. Whether `ml-4` *should* become `ms-4` depends
 * on whether that element is meant to mirror — a code block, a chart axis or a
 * Latin-script logotype should stay physical. That is a judgment call per call
 * site, so the rule names the replacement and leaves the edit to a human.
 *
 * Only utilities with a true logical equivalent are reported. `translate-x-*`
 * and `origin-left` have none in Tailwind and need an explicit `rtl:` variant;
 * `space-x-*` and `divide-x-*` already compile to `margin-inline-*` and
 * `border-inline-*-width` under Tailwind v4, so they are not physical at all.
 */

/**
 * Physical utilities that are only valid with a value segment (`ml-4`). A bare
 * `ml`, `left` or `pr` is not a Tailwind class, so a token that matches one of
 * these exactly is not a class list — it is an ISO-639 code, a discriminant
 * like `side === "right"`, or some other ordinary string.
 */
const REQUIRES_VALUE = {
  ml: "ms",
  mr: "me",
  pl: "ps",
  pr: "pe",
  left: "start",
  right: "end",
  "scroll-ml": "scroll-ms",
  "scroll-mr": "scroll-me",
  "scroll-pl": "scroll-ps",
  "scroll-pr": "scroll-pe",
}

/** Physical utilities valid bare (`border-l`) and with a value (`border-l-2`). */
const BARE_OR_VALUED = {
  "border-l": "border-s",
  "border-r": "border-e",
  "rounded-l": "rounded-s",
  "rounded-r": "rounded-e",
  "rounded-tl": "rounded-ss",
  "rounded-tr": "rounded-se",
  "rounded-bl": "rounded-es",
  "rounded-br": "rounded-ee",
}

/** Physical utilities that never take a value segment. */
const BARE_ONLY = {
  "text-left": "text-start",
  "text-right": "text-end",
  "float-left": "float-start",
  "float-right": "float-end",
  "clear-left": "clear-start",
  "clear-right": "clear-end",
}

const VALUED = { ...REQUIRES_VALUE, ...BARE_OR_VALUED }
// Longest first. Defensive only: because every match requires a trailing
// hyphen, no base can currently match two keys — but that holds by accident of
// the current key set, not by construction.
const VALUED_PREFIXES = Object.keys(VALUED).sort((a, b) => b.length - a.length)

const CLASS_ATTRIBUTES = new Set(["className", "class"])
const CLASS_BUILDERS = new Set([
  "cn",
  "clsx",
  "classNames",
  "cva",
  "twMerge",
  "twJoin",
])

/**
 * Builders whose *object keys* are class names (`cn({ "ml-4": isActive })`).
 * `cva`'s config object is keyed by variant name instead, so a hyphenated
 * variant like `{ side: { "left-panel": … } }` must not be read as a class.
 */
const OBJECT_KEY_BUILDERS = new Set(["cn", "clsx", "classNames"])

/**
 * Node types a class string may legitimately sit inside on the way to the
 * attribute or builder call that consumes it. Anything else — a comparison, a
 * nested call, a member access — means the string has left class-composition
 * context and must not be read as a class list.
 */
const COMPOSITION_NODES = new Set([
  "ConditionalExpression",
  "LogicalExpression",
  "ArrayExpression",
  "ObjectExpression",
  "Property",
  "TemplateLiteral",
  "TaggedTemplateExpression",
  "SpreadElement",
  "JSXExpressionContainer",
  // TypeScript wrappers pass the value through unchanged. The rule only ever
  // runs on `.ts`/`.tsx` (see `eslint.config.js`), so `cn("ml-4" as const)` is
  // ordinary code here, not an exotic case.
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
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
  // Important is trailing in v4 (`ml-4!`) and leading in the v3 compat syntax
  // (`!ml-4`); `-` marks a negative. All are stripped and reattached verbatim,
  // so we never have to guess which order Tailwind blesses.
  const leading = /^[!-]*/.exec(utility)[0]
  const withoutLeading = utility.slice(leading.length)
  const trailing = withoutLeading.endsWith("!") ? "!" : ""
  const base = trailing ? withoutLeading.slice(0, -1) : withoutLeading
  const prefix = variants + leading

  const logical = toLogicalBase(base)
  return logical === null ? null : prefix + logical + trailing
}

/** Maps a bare utility (no variants, no modifiers) to its logical form. */
function toLogicalBase(base) {
  // `Object.hasOwn`, not truthiness — a plain `MAP[base]` lookup resolves
  // `constructor` and `toString` off Object.prototype.
  if (Object.hasOwn(BARE_ONLY, base)) return BARE_ONLY[base]
  if (Object.hasOwn(BARE_OR_VALUED, base)) return BARE_OR_VALUED[base]

  for (const physical of VALUED_PREFIXES) {
    // Requires the hyphen, so `border-lime-500` never matches `border-l`.
    if (base.startsWith(`${physical}-`)) {
      return VALUED[physical] + base.slice(physical.length)
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
    schema: [],
    messages: {
      physical:
        '`{{physical}}` does not mirror under `dir="rtl"`. Use `{{logical}}`.',
    },
  },

  create(context) {
    const { sourceCode } = context

    // Walks up only through class-composition nodes, so a string that has left
    // that context — `someFn("pr-review")`, `styles["left-panel"]`,
    // `side === "right"` — is never read as a class list.
    function isClassContext(node) {
      let current = node
      let parent = current.parent
      // Whether the string reached us as an object *key* rather than a value.
      let viaObjectKey = false

      while (parent) {
        if (parent.type === "JSXAttribute") {
          return (
            !viaObjectKey &&
            parent.name.type === "JSXIdentifier" &&
            CLASS_ATTRIBUTES.has(parent.name.name)
          )
        }
        if (parent.type === "CallExpression") {
          if (parent.callee.type !== "Identifier") return false
          const builders = viaObjectKey ? OBJECT_KEY_BUILDERS : CLASS_BUILDERS
          return builders.has(parent.callee.name)
        }
        if (parent.type === "Property" && parent.key === current) {
          viaObjectKey = true
        }
        if (!COMPOSITION_NODES.has(parent.type)) return false

        current = parent
        parent = current.parent
      }
      return false
    }

    function check(node) {
      const text = sourceCode.getText(node)
      const offset = node.range[0]

      for (const match of text.matchAll(TOKEN)) {
        const logical = toLogical(match[0])
        if (!logical) continue

        const start = offset + match.index
        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(start),
            end: sourceCode.getLocFromIndex(start + match[0].length),
          },
          messageId: "physical",
          data: { physical: match[0], logical },
        })
      }
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
