import { createContext, useContext, useMemo } from "react"
import { logger } from "@/lib/logger"

interface AnalyticsBackend {
  track: (event: string, properties?: Record<string, unknown>) => void
  identify: (userId: string, traits?: Record<string, unknown>) => void
  page: (name?: string, properties?: Record<string, unknown>) => void
}

const defaultBackend: AnalyticsBackend = {
  track(event, properties) {
    logger.info("analytics.track", { event, ...properties })
  },
  identify(userId, traits) {
    logger.info("analytics.identify", { userId, ...traits })
  },
  page(name, properties) {
    logger.info("analytics.page", { name, ...properties })
  },
}

const AnalyticsContext = createContext<AnalyticsBackend>(defaultBackend)

interface AnalyticsProviderProps {
  children: React.ReactNode
  backend?: AnalyticsBackend
}

export function AnalyticsProvider({
  children,
  backend,
}: AnalyticsProviderProps) {
  const value = useMemo(() => backend ?? defaultBackend, [backend])
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  return useContext(AnalyticsContext)
}
