import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { toast } from "sonner"
import { ThemeProvider } from "./components/theme-provider"
import { Skeleton } from "./components/ui/skeleton"
import "./index.css"
import { AnalyticsProvider } from "./lib/analytics"
import { getErrorMessage } from "./lib/api-errors"
import { AuthProvider, useAuth } from "./lib/auth"
import { FeatureFlagProvider } from "./lib/feature-flags"
import { routeTree } from "./routeTree.gen"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: async (error, _variables, _context, mutation) => {
      if (mutation.meta?.skipGlobalError) return
      const message = await getErrorMessage(error)
      toast.error(message)
    },
  }),
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      skipGlobalError?: boolean
    }
  }
}

function AppShellSkeleton() {
  return (
    <>
      <nav className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="w-8" />
            <span className="font-sans text-lg tracking-wide">App Name</span>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </nav>
      <div className="relative flex min-h-screen pt-14">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 pt-16">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-14 w-96" />
            <Skeleton className="mx-auto h-5 w-[32rem] max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function App() {
  const auth = useAuth()
  if (auth.isLoading) return <AppShellSkeleton />
  return <RouterProvider router={router} context={{ auth }} />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="app_theme">
        <AuthProvider>
          <AnalyticsProvider>
            <FeatureFlagProvider>
              <App />
            </FeatureFlagProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
