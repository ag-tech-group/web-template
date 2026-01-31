import ky, { type Options } from "ky"

export const baseUrl = import.meta.env.VITE_API_URL || "/api"

// Callback for handling 401 responses - set this from your auth provider/router
export let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback
}

// Singleton promise to coalesce concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    return res.status === 204
  } catch {
    return false
  }
}

export const api = ky.create({
  prefixUrl: baseUrl,
  timeout: 30000,
  credentials: "include",
  // Retries are handled by TanStack React Query
  retry: 0,
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (response.status !== 401) return

        // Don't try to refresh if this IS the refresh request (prevent loop)
        const url = request.url
        if (url.includes("/auth/refresh") || url.includes("/auth/jwt/logout")) {
          if (onUnauthorized) onUnauthorized()
          return
        }

        // Coalesce concurrent refresh attempts
        if (!refreshPromise) {
          refreshPromise = attemptRefresh().finally(() => {
            refreshPromise = null
          })
        }

        const refreshed = await refreshPromise

        if (refreshed) {
          // Retry the original request with new cookies
          return ky(request, options)
        }

        if (onUnauthorized) onUnauthorized()
      },
    ],
  },
})

export type { Options as ApiOptions }
