import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useMemo } from "react"
import { api } from "@/api/api"

type FlagMap = Record<string, boolean>

interface FeatureFlagContextValue {
  flags: FlagMap
  isLoading: boolean
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: {},
  isLoading: false,
})

function getEnvFlags(): FlagMap {
  const flags: FlagMap = {}
  for (const [key, value] of Object.entries(import.meta.env)) {
    if (key.startsWith("VITE_FEATURE_")) {
      const name = key.replace("VITE_FEATURE_", "").toLowerCase()
      flags[name] = value === "true" || value === "1"
    }
  }
  return flags
}

interface FeatureFlagProviderProps {
  children: React.ReactNode
  /** Override flags for testing — skips the API call entirely. */
  staticFlags?: FlagMap
}

export function FeatureFlagProvider({
  children,
  staticFlags,
}: FeatureFlagProviderProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      try {
        return await api.get("flags").json<FlagMap>()
      } catch {
        return getEnvFlags()
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: staticFlags === undefined,
  })

  const value = useMemo<FeatureFlagContextValue>(() => {
    if (staticFlags !== undefined) {
      return { flags: staticFlags, isLoading: false }
    }
    return { flags: data ?? getEnvFlags(), isLoading }
  }, [staticFlags, data, isLoading])

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlag(flagName: string): {
  enabled: boolean
  loading: boolean
} {
  const { flags, isLoading } = useContext(FeatureFlagContext)
  return { enabled: !!flags[flagName], loading: isLoading }
}

export function Feature({
  flag,
  children,
}: {
  flag: string
  children: React.ReactNode
}) {
  const { enabled } = useFeatureFlag(flag)
  if (!enabled) return null
  return <>{children}</>
}

export function useInvalidateFeatureFlags() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["feature-flags"] })
}
