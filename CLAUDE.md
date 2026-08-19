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
pnpm typecheck                   # type check (tsc -b --noEmit)
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
- **Direction utilities are logical, not physical.** Use `ms-`/`me-`, `ps-`/`pe-`,
  `start-`/`end-`, `text-start`/`text-end`, `border-s`/`border-e`,
  `rounded-s`/`rounded-e` rather than `ml-`, `pr-`, `left-`, `text-left`. Nothing
  enforces it — see RTL readiness for why that's an adopter's call.
- **Stale code-split chunks prompt a reload.** A `vite:preloadError` listener in
  `main.tsx` surfaces a "new version available" toast (sonner) when a deploy has
  replaced the chunk an open tab is importing, letting the user reload on their
  own terms rather than force-reloading over unsaved work. See hardening.
- **Web Storage is mocked in `src/test/setup.ts` — don't delete it as
  redundant.** It looks like something jsdom already provides, and on Node 24 it
  is. Node 26 ships its own Web Storage and registers both globals, which shadow
  jsdom's under vitest (`window === globalThis`). `localStorage` becomes
  `undefined` unless `--localstorage-file` is passed, so readers throw
  mid-render; `sessionStorage` still works but is Node's `Storage`, not jsdom's,
  so it fails `instanceof` and `vi.spyOn(Storage.prototype, ...)` silently never
  fires. The mock is installed on `Storage.prototype` for that reason — a class
  mock shadows the prototype and reintroduces the silent-spy failure. Fixing it
  in source doesn't work; the globals have to be replaced in setup.

## RTL readiness — a decision to make up front

The template ships zero physical direction utilities, so it starts RTL-clean and
`<html dir="ltr">` in `index.html` is the one switch to flip. **Whether to _hold_
that property is an adopter's call, made early**, because retrofitting it later
means auditing every className in the tree.

- **If the app will never ship RTL,** ignore this. Physical utilities are fine and
  nothing here objects to them.
- **If RTL is plausible,** keep using logical utilities and decide how you'll hold
  the line — code review, or a lint rule. Nothing in the template enforces it: an
  error-level rule is a policy this template shouldn't impose on every project
  scaffolded from it, and a partial rule is worse than an explicit convention.
  A worked implementation (with tests, and the traps that make it harder than it
  looks) is in the branch history of PR #39 if you want to lift it.
- **`shadcn add` is where drift enters.** The upstream registry is LTR-only, so
  anything past the five primitives here (button, card, input, label, skeleton)
  arrives with `pl-8`, `left-2`, `text-left`. Convert on the way in, or accept the
  app is LTR-only.
- **Some utilities have no logical form.** `translate-x-*`, `origin-left`/`-right`
  and slide-in animation classes have no Tailwind replacement — they need an
  explicit `rtl:` variant.
- **`space-x-*` and `divide-x-*` are already safe** under Tailwind v4: they compile
  to `margin-inline-start`/`-end` and `border-inline-start-width`/`-end-width`.
  This was not true in v3, so don't "fix" them when porting older code in.
- **Toast position is deliberately physical.** `<Toaster position="bottom-right">`
  in `__root.tsx` is app chrome, not content flow, and stays pinned regardless of
  direction. Change it per-app if a design calls for it.

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
