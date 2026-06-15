#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

/**
 * license-header.mjs — stamp or verify SPDX license headers on source files.
 *
 * Usage:
 *   node scripts/license-header.mjs --check --all      verify every tracked source file (CI)
 *   node scripts/license-header.mjs --fix --all        stamp every tracked source file
 *   node scripts/license-header.mjs --fix <files...>   stamp specific files (lint-staged)
 *
 * Default mode is --check. Re-running is safe: a file already carrying an
 * SPDX identifier in its first lines is left untouched (idempotent), so the
 * lint-staged auto-fix and the CI check can never disagree.
 */

import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const HEADER = [
  "// SPDX-FileCopyrightText: 2026 AG Technology Group LLC",
  "// SPDX-License-Identifier: Apache-2.0",
]

const SOURCE_EXT = /\.(ts|tsx|js|jsx)$/
// Vendored deps, build output, and the Orval-generated client are never stamped.
const SKIP_PATH = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)\.next\//,
  /(^|\/)coverage\//,
  /(^|\/)src\/api\/generated\//,
]
const GENERATED_NAME = /\.gen\.(ts|tsx|js|jsx)$/
const GENERATED_BANNER = /@generated|do not edit|automatically generated/i

// Returns "skip" (with reason), "stamped" (already has a header), or "needs".
function classify(file, content) {
  if (!SOURCE_EXT.test(file))
    return { status: "skip", reason: "not a source file" }
  if (SKIP_PATH.some((re) => re.test(file)))
    return { status: "skip", reason: "vendored/output path" }
  if (GENERATED_NAME.test(file))
    return { status: "skip", reason: "generated (*.gen.*)" }
  const lines = content.split("\n")
  if (GENERATED_BANNER.test(lines.slice(0, 15).join("\n")))
    return { status: "skip", reason: "generated banner" }
  if (lines.slice(0, 10).join("\n").includes("SPDX-License-Identifier"))
    return { status: "stamped" }
  return { status: "needs" }
}

// Insert the header at the very top — above triple-slash directives (a plain
// comment before `/// <reference>` keeps the directive valid) — but below a
// shebang if present. Leaves exactly one blank line before the original code.
function applyHeader(content) {
  const lines = content.split("\n")
  const shebang = lines[0]?.startsWith("#!") ? lines.shift() : null
  while (lines.length && lines[0].trim() === "") lines.shift()
  const out = []
  if (shebang) out.push(shebang)
  out.push(...HEADER, "", ...lines)
  const result = out.join("\n")
  return result.endsWith("\n") ? result : result + "\n"
}

const args = process.argv.slice(2)
const fix = args.includes("--fix")
const explicit = args.filter((a) => !a.startsWith("--"))
const targets = args.includes("--all")
  ? execFileSync("git", ["ls-files", "*.ts", "*.tsx", "*.js", "*.jsx"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
  : explicit

const stamped = []
const already = []
const skipped = []
const missing = []

for (const file of targets) {
  let content
  try {
    content = readFileSync(file, "utf8")
  } catch {
    continue // file was deleted between staging and run
  }
  const c = classify(file, content)
  if (c.status === "skip") skipped.push(`${file} (${c.reason})`)
  else if (c.status === "stamped") already.push(file)
  else if (fix) {
    writeFileSync(file, applyHeader(content))
    stamped.push(file)
  } else missing.push(file)
}

if (fix) {
  console.log(
    `license-header: stamped ${stamped.length}, already ${already.length}, skipped ${skipped.length}`
  )
  for (const f of stamped) console.log(`  + ${f}`)
} else if (missing.length) {
  console.error(
    `license-header: ${missing.length} file(s) missing an SPDX header:`
  )
  for (const f of missing) console.error(`  - ${f}`)
  console.error('Run "pnpm run license:fix" to add them.')
  process.exit(1)
} else {
  console.log(
    `license-header: OK — ${already.length} stamped, ${skipped.length} skipped`
  )
}
