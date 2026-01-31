<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/logo-light.png">
  <img alt="AG Technology Group" src=".github/assets/logo-light.png" width="200">
</picture>

# React Stack Template

[![CI](https://github.com/ag-tech-group/web-template/actions/workflows/ci.yml/badge.svg)](https://github.com/ag-tech-group/web-template/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)](https://nodejs.org/)

A production-ready React starter template built with Vite, TanStack Router, TanStack Query, shadcn/ui, and Tailwind CSS v4. Includes cookie-based auth, dark mode, toast notifications, and security hardening.

Designed to pair with [api-template](https://github.com/ag-tech-group/api-template) (FastAPI backend with cookie JWT auth and refresh tokens), but can work with any backend.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **shadcn/ui** - Composable component library (Button, Card, Input, Label)
- **Tailwind CSS v4** - Utility-first CSS framework
- **Zod v4** - TypeScript-first schema validation
- **ky** - HTTP client with automatic token refresh
- **orval** - OpenAPI client generator (React Query hooks, TypeScript types, Zod schemas, MSW mocks)
- **MSW** - API mocking for tests and development
- **Husky** - Pre-commit hooks (lint, test, build)

## Features

- Type-safe file-based routing with TanStack Router
- Cookie-based auth with automatic token refresh and request coalescing
- Dark/light/system theme with localStorage persistence
- Global mutation error handling with toast notifications
- Content Security Policy headers
- 404 not-found page
- Auth context available in router for route guards
- Auto-generated API client from OpenAPI specs via orval
- Test utilities with configurable auth state

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm (recommended, but any Node package manager should work)

### Installation

```bash
# Clone the repository
cd web-template

# Install dependencies
pnpm install

# (Optional) Generate API client
# Requires a running backend with an OpenAPI spec; you can skip this for now
# and run it later once your backend is up (see "API Client Generation" section).
pnpm generate-api
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Set `VITE_API_URL=http://localhost:8000` in a `.env` file to connect to a local backend.

### Build

```bash
pnpm build
```

## Customizing for Your App

After creating a project from this template, update the following:

- **App name** — Replace `React Modern Stack` with your app name in:
  - `index.html` (page title)
  - `src/pages/home/home-page.tsx` (heading and description)
  - `src/pages/home/home-page.test.tsx` (test assertion)
- **Package name** — Update `name` in `package.json`
- **Content Security Policy** — In `index.html`, update the CSP meta tag:
  - Add your production API domain to `connect-src` (e.g. `https://api.yourapp.com`)
  - Remove `http://localhost:*` for production builds, or use environment-specific CSP
  - Consider replacing `'unsafe-inline'` with nonce-based CSP via a Vite plugin like `vite-plugin-csp` for stricter security
- **localStorage keys** (optional) — Rename the key prefixes if you want app-specific isolation:
  - `app_theme` in `src/components/theme-provider.tsx`
  - `app_auth_email` in `src/lib/auth.tsx`
- **Environment variables** — See [Environment Variables](#environment-variables) for `VITE_API_URL` and `OPENAPI_URL`

## Authentication

The template includes a complete auth setup designed to work with the companion [api-template](https://github.com/ag-tech-group/api-template):

- **AuthProvider** (`src/lib/auth.tsx`) — React context tracking `isAuthenticated`, `isLoading`, `email`, and `userId`
- **Automatic token refresh** (`src/api/api.ts`) — 401 responses trigger a refresh attempt; concurrent requests are coalesced into a single refresh call
- **Session check on load** — `GET /auth/me` validates the session on mount
- **Auth in router context** — `auth` is available in route `beforeLoad` for route guards

### How it works

1. Backend sets httpOnly cookies (`app_access` + `app_refresh`) on login
2. All API requests include cookies via `credentials: "include"`
3. On 401, the client POSTs to `/auth/refresh` to rotate tokens
4. If refresh succeeds, the original request is retried transparently
5. If refresh fails, `onUnauthorized` fires and auth state is cleared

## Theming

Dark/light/system theme support via `ThemeProvider`:

- `useTheme()` hook for reading/setting the theme
- `ThemeToggle` component for cycling between modes
- Persists to localStorage (key: `app_theme`)
- Applies `.dark` / `.light` class to `<html>` for Tailwind dark mode

## Error Handling

- **Global mutation errors** — `MutationCache` in `QueryClient` catches errors from all mutations and shows a toast via sonner
- **Per-mutation opt-out** — Set `meta: { skipGlobalError: true }` on a mutation to handle errors locally
- **`getErrorMessage()`** (`src/lib/api-errors.ts`) — Extracts human-readable messages from FastAPI error responses (supports `detail` as string, array, or object)

## API Client Generation

This template uses [orval](https://orval.dev/) to generate type-safe React Query hooks from your backend's OpenAPI specification.

### Generate API Client

```bash
# Start your backend server first, then:
pnpm generate-api
```

This generates:

- React Query hooks (`useQuery`/`useMutation`) in `src/api/generated/hooks/` — with integrated Zod validation
- TypeScript types for all request/response schemas in `src/api/generated/types/`
- Standalone Zod schemas in `src/api/generated/zod/` (for form validation, manual use)
- MSW mock handlers for testing in `src/api/generated/mocks/`

### Configuration

The orval configuration is in `orval.config.ts`. By default, it fetches the OpenAPI spec from `http://localhost:8000/openapi.json`.

For CI/CD, set the `OPENAPI_URL` repository variable to point to your staging/dev backend. The CI workflow will verify that generated types are up-to-date.

### Usage

After generating, import hooks and schemas from `src/api/generated/`. The generated code is organized by API tags.

**React Query hooks (with automatic Zod validation):**

```typescript
import { useGetNotes, useCreateNote } from "@/api/generated/hooks/notes/notes"

function NoteList() {
  const { data, isLoading, error } = useGetNotes()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

**Standalone Zod schemas (for form validation, etc.):**

```typescript
import { NoteCreate } from "@/api/generated/zod/notes/notes"

const result = NoteCreate.safeParse(formData)
if (!result.success) {
  console.error(result.error.issues)
}
```

> **Note:** The exact imports and response structures depend on your backend's OpenAPI specification. Check the generated files in `src/api/generated/` after running `pnpm generate-api`.

## Testing

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run
pnpm test:coverage # With coverage
pnpm test:ui       # Visual UI
```

### Test Utilities

`renderWithFileRoutes()` (`src/test/renderers.tsx`) renders the full router with providers and configurable auth state:

```typescript
import { renderWithFileRoutes } from "@/test/renderers"

// Default: authenticated as test@example.com
await renderWithFileRoutes(<div />, { initialLocation: "/dashboard" })

// Custom auth state
await renderWithFileRoutes(<div />, {
  initialLocation: "/login",
  routerContext: {
    auth: {
      isAuthenticated: false,
      isLoading: false,
      email: null,
      userId: null,
      login: () => {},
      logout: async () => {},
      checkAuth: async () => {},
    },
  },
})
```

MSW handlers are configured in `src/api/handlers.ts`. A default handler for `/auth/me` (returns 401) is included to suppress warnings during tests.

## Project Structure

```
src/
├── api/
│   ├── api.ts              # Ky client with token refresh
│   ├── orval-client.ts     # Custom adapter for orval (uses ky)
│   ├── handlers.ts         # MSW handlers aggregator
│   └── generated/          # Auto-generated (do not edit)
│       ├── hooks/          # React Query hooks
│       ├── types/          # TypeScript types
│       ├── zod/            # Zod schemas
│       └── mocks/          # MSW mock handlers
├── components/
│   ├── ui/                 # shadcn/ui components (Button, Card, Input, Label)
│   ├── theme-provider.tsx  # Dark/light/system theme context
│   ├── theme-toggle.tsx    # Theme cycle button
│   └── not-found.tsx       # 404 page
├── lib/
│   ├── auth.tsx            # AuthProvider + useAuth hook
│   ├── api-errors.ts       # Error message extraction
│   └── utils.ts            # cn() class merge helper
├── pages/                  # Page components
├── routes/                 # TanStack Router file-based routes
│   ├── __root.tsx          # Root layout (Toaster, devtools, NotFound)
│   └── index.tsx           # Home page route
├── test/
│   ├── setup.ts            # Vitest + MSW setup
│   └── renderers.tsx       # renderWithFileRoutes() test utility
└── main.tsx                # Entry point (providers, router, mutation cache)
```

## Adding Components

This template uses shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
# etc.
```

## Environment Variables

| Variable       | Description                            | Default                              |
| -------------- | -------------------------------------- | ------------------------------------ |
| `VITE_API_URL` | Backend API URL                        | `/api`                               |
| `OPENAPI_URL`  | OpenAPI spec URL (for code generation) | `http://localhost:8000/openapi.json` |

`OPENAPI_URL` is only used during development for `pnpm generate-api`. It is not needed in production — the generated files are committed to the repo.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vite](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)
- [ky](https://github.com/sindresorhus/ky)
- [orval](https://orval.dev/)
- [MSW](https://mswjs.io/)
