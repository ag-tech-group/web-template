import { api } from "./api"

/**
 * Custom client adapter for orval that uses our configured Ky instance.
 * This ensures all generated API calls use our centralized configuration
 * (base URL, auth, error handling, etc.)
 *
 * Orval calls this as: orvalClient(url, requestInit)
 */
export const orvalClient = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  // Remove leading slash if present since Ky prefixUrl handles it
  const normalizedUrl = url.startsWith("/") ? url.slice(1) : url

  const response = await api(normalizedUrl, {
    method: options?.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    headers: options?.headers as Record<string, string>,
    body: options?.body,
    signal: options?.signal,
  })

  // Handle empty responses (204 No Content, etc.)
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    return undefined as T
  }

  return response.json()
}

export default orvalClient
