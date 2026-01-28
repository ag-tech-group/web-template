interface ThrowErrorOptions {
  message: string
  error?: unknown
  logData?: Record<string, unknown>
}

export function throwError({
  message,
  error,
  logData,
}: ThrowErrorOptions): never {
  // Inject your logger here (e.g., Sentry, DataDog, custom logger)
  console.error(message, { error, ...logData })
  throw error instanceof Error ? error : new Error(message, { cause: error })
}
