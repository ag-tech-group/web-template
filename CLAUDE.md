# web-template

Vite + React 19 SPA starter: TanStack Router (file-based, code-split routes) +
TanStack Query, an orval-generated typed API client (hooks + Zod + MSW mocks) over
a Ky mutator, Tailwind + shadcn/ui, and sonner toasts. See `README.md` for the
full tour.

## How to run things

```bash
pnpm install
pnpm dev                         # dev server
pnpm build                       # generate-routes + tsc -b + vite build

# Checks (exactly what CI runs)
pnpm lint                        # eslint
pnpm format:check                # prettier (use `pnpm format` to apply)
pnpm tsc --noEmit                # type check
pnpm test:run                    # vitest (one-shot)

pnpm generate-api                # regenerate the orval client from the OpenAPI spec
```

CI (`.github/workflows/ci.yml`) runs lint + format-check + type-check + test, plus
a `verify-api-types` job that fails if the committed client is out of date with the
spec (only when the `OPENAPI_URL` repo variable is set).

## Conventions

- **The generated API client is committed.** After any backend contract change,
  run `pnpm generate-api` and commit the result — `verify-api-types` enforces it.
  Treat `src/api/generated/` as read-only output.
- **Coerce nullable/optional API fields at the adapter boundary, not at each
  consumer.** Normalize a DTO into the shape your components rely on in one place,
  so every consumer sees a total type. See hardening.
- **Global mutation errors** surface via the `MutationCache` in `main.tsx` (toast);
  opt out per-mutation with `meta: { skipGlobalError: true }`.
- **Direction utilities must be logical, not physical.** Use `ms-`/`me-`,
  `ps-`/`pe-`, `start-`/`end-`, `text-start`/`text-end`, `border-s`/`border-e`,
  `rounded-s`/`rounded-e` — never `ml-`, `pr-`, `left-`, `text-left`. The local
  `local/logical-direction-classes` ESLint rule enforces this, so a consuming app
  can flip `<html dir>` in `index.html` to `rtl` and have the layout mirror.
  See RTL readiness.
- **Stale code-split chunks prompt a reload.** A `vite:preloadError` listener in
  `main.tsx` surfaces a "new version available" toast (sonner) when a deploy has
  replaced the chunk an open tab is importing, letting the user reload on their
  own terms rather than force-reloading over unsaved work. See hardening.

## RTL readiness

The template ships no physical direction utilities, and `local/logical-direction-classes`
(`eslint-rules/logical-direction-classes.js`) keeps it that way — a downstream app
should only ever have to change `dir="ltr"` on `<html>` in `index.html`.

- **The rule reports; it does not autofix.** Deliberate. Whether `ml-4` _should_
  become `ms-4` depends on whether that element is meant to mirror — a code block,
  a chart axis or a Latin-script logotype should stay physical, with an
  `eslint-disable-next-line` and a reason. Converting by hand means looking at each
  one. An autofix would assert "always mirror" silently across every file it
  touched.
- **`shadcn add` writes physical utilities.** The upstream registry is LTR-only, so
  anything past the five primitives here (button, card, input, label, skeleton)
  arrives with `pl-8`, `left-2`, `text-left`. Convert on the way in — that is the
  whole point of the rule existing.
- **It fires only in class positions.** `className`/`class` attributes and
  `cn`/`clsx`/`classNames`/`cva`/`twMerge`/`twJoin` calls, and it stops walking at a
  comparison, a non-builder call or a member access — so `side === "right"`,
  `someFn("pr-review")` and `styles["left-panel"]` are left alone. Getting this
  wrong is how a rule like this breaks shadcn's `sheet.tsx`, whose `SheetContent`
  discriminates on `side === "right"` right next to the class list.
- **Some utilities have no logical form.** `translate-x-*` and `origin-left`/
  `origin-right` are not reported because Tailwind offers no replacement — they
  need an explicit `rtl:` variant. Slide-in animation classes
  (`slide-in-from-left-2`) are likewise left alone.
- **`space-x-*` and `divide-x-*` are already safe** under Tailwind v4: they compile
  to `margin-inline-start`/`-end` and `border-inline-start-width`/`-end-width`.
  This was not true in v3, so don't "fix" them when porting older code in.
- **Toast position is deliberately physical.** `<Toaster position="bottom-right">`
  in `__root.tsx` is app chrome, not content flow, and stays pinned regardless of
  direction. Change it per-app if a design calls for it.
- **Known blind spots.** The rule doesn't see `utils.cn("ml-2")` (member-expression
  callee), a class string assigned to a variable before use, a bare
  `{ className: "ml-4" }` object outside a builder call, or arbitrary properties
  like `[margin-left:4px]` — that last one is genuinely physical CSS that slips the
  net. Treat the rule as a backstop, not a proof of RTL-safety.

## Production hardening — gotchas learned under real live-event load

> Distilled from running a sibling SPA through a high-traffic live event.
> General, framework-level lessons — worth a read before shipping to production,
> especially anything that deploys frequently under live traffic.

- [ ] **A code-split SPA orphans chunks for already-open tabs on _every_ deploy.**
      Each build content-hashes its chunk filenames; a tab on a previous build 404s
      when it lazily imports a replaced route chunk. The `vite:preloadError` listener
      in `main.tsx` catches it and prompts the user to reload (a toast, not a forced
      reload — the event also fires for `defaultPreload: "intent"` hover preloads,
      where an auto-reload would yank the page out from under the user and discard
      unsaved work). Expect a per-deploy blip under live traffic (consider a deploy
      freeze at peak viewership).
- [ ] **A sort comparator must be total — never throw.** A comparator runs over
      whatever the cache holds, including a partial or stale-shaped row served during a
      deploy rollover. `a.name.localeCompare(b.name)` throws if `name` is ever
      `undefined` and takes down the _entire_ list render, not just that row. Null-guard
      the comparator _and_ coerce the field at the adapter boundary.
- [ ] **Coerce nullable fields at one chokepoint.** Enforce the field's type where
      the DTO enters your app (the adapter), not at each call site —
      `name: dto.name ?? ""`. One stale/old-shape response from a rollover then can't
      crash a stricter downstream consumer.
- [ ] **`void promise` ≠ handled.** Prefixing a fire-and-forget call with `void`
      silences the floating-promise lint, not the runtime rejection — and the promise
      that actually rejects may not be the one you `.catch()`. Catch the real owner, or
      filter the class at the reporting boundary.
- [ ] **Intentional cancellation is not an error.** An `AbortError` from a
      cancelled in-flight fetch (e.g. a query invalidated mid-flight) is expected
      noise — don't surface or report it. Filter it at the reporting boundary rather
      than chasing every call site that might own a cancelled request.
- [ ] **API schema changes need consumer coordination.** The client is generated
      from the backend's OpenAPI spec and is in lockstep via
      `generate-api`/`verify-api-types`. Land a backend contract change _with_ the
      client regen and any null-handling the new shape needs — not ahead of it — or CI
      goes red and the live FE breaks on the new shape.
- [ ] **Green CI ≠ verified in prod.** A plausible diff that compiles and passes
      tests is not proof the fix works against the real, rebuilt, deployed artifact.
      Confirm against the actual deployed build before trusting a fix — especially for
      errors that only reproduce under real traffic or across deploy rollovers.
