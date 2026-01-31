const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "The requested resource was not found.",
  409: "This conflicts with an existing resource.",
  422: "Please check your input and try again.",
  429: "Too many requests. Please wait a moment.",
  500: "Something went wrong on our end. Please try again later.",
}

export async function getErrorMessage(
  error: unknown,
  fallback?: string
): Promise<string> {
  try {
    const response = (error as { response?: Response })?.response
    if (!response) return fallback ?? "An unexpected error occurred."

    const body = await response.clone().json()
    const detail = body?.detail

    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((e: { msg: string }) => e.msg).join(". ")
    }
    if (typeof detail === "object" && detail !== null) {
      return Object.values(detail).join(". ")
    }

    return (
      STATUS_MESSAGES[response.status] ??
      fallback ??
      "An unexpected error occurred."
    )
  } catch {
    return fallback ?? "An unexpected error occurred."
  }
}
