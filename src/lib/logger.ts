type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const configuredLevel: LogLevel =
  ((import.meta.env.VITE_LOG_LEVEL as string)?.toLowerCase() as LogLevel) ||
  (import.meta.env.DEV ? "debug" : "warn")

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel]
}

function formatLog(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
) {
  if (import.meta.env.DEV) {
    return { args: data ? [message, data] : [message] }
  }
  return {
    args: [
      JSON.stringify({
        level,
        message,
        ...data,
        timestamp: new Date().toISOString(),
      }),
    ],
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>) {
    if (!shouldLog("debug")) return
    const { args } = formatLog("debug", message, data)
    console.debug(...args)
  },

  info(message: string, data?: Record<string, unknown>) {
    if (!shouldLog("info")) return
    const { args } = formatLog("info", message, data)
    console.info(...args)
  },

  warn(message: string, data?: Record<string, unknown>) {
    if (!shouldLog("warn")) return
    const { args } = formatLog("warn", message, data)
    console.warn(...args)
  },

  error(message: string, data?: Record<string, unknown>) {
    if (!shouldLog("error")) return
    const { args } = formatLog("error", message, data)
    console.error(...args)
  },
}
