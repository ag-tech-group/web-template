import ky, { type Options } from "ky"

export const baseUrl = import.meta.env.VITE_API_URL || "/api"

export const api = ky.create({
  prefixUrl: baseUrl,
  timeout: 30000, // Retries are handled by TanStack React Query
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem("auth_token")
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem("auth_token")
          window.location.href = "/login"
        }
      },
    ],
  },
})

export type { Options as ApiOptions }
