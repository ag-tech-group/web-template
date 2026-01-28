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

  // Normalize body for Ky: JSON stringify plain objects, pass through supported types
  let kyBody = options?.body
  if (kyBody && typeof kyBody === "object") {
    const isFormData =
      typeof FormData !== "undefined" && kyBody instanceof FormData
    const isUrlSearchParams =
      typeof URLSearchParams !== "undefined" &&
      kyBody instanceof URLSearchParams
    const isBlob = typeof Blob !== "undefined" && kyBody instanceof Blob
    const isArrayBuffer = kyBody instanceof ArrayBuffer
    const isArrayBufferView = ArrayBuffer.isView(kyBody)
    const isReadableStream =
      typeof ReadableStream !== "undefined" && kyBody instanceof ReadableStream

    if (
      !isFormData &&
      !isUrlSearchParams &&
      !isBlob &&
      !isArrayBuffer &&
      !isArrayBufferView &&
      !isReadableStream
    ) {
      kyBody = JSON.stringify(kyBody)
    }
  }

  // Errors (network failures, 4xx/5xx) propagate to React Query's error handling
  const response = await api(normalizedUrl, {
    method: options?.method,
    headers: options?.headers,
    body: kyBody,
    signal: options?.signal,
  })

  // 204 No Content - orval types these responses as void
  if (response.status === 204) {
    return undefined as T
  }

  // Ensure we have JSON content
  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Unexpected non-JSON response: ${response.status} ${contentType}`
    )
  }

  return response.json()
}

export default orvalClient
