// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import { lazy, Suspense, useEffect } from "react"
import { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  Outlet,
  useRouter,
} from "@tanstack/react-router"
import { Toaster } from "sonner"
import { useAnalytics } from "@/lib/analytics"

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      }))
    )

const ReactQueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )

interface RouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
    isLoading: boolean
    email: string | null
    userId: string | null
    login: (email: string) => void
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RouteTracker() {
  const router = useRouter()
  const analytics = useAnalytics()
  useEffect(() => {
    return router.subscribe("onResolved", ({ toLocation }) => {
      analytics.page(toLocation.pathname)
    })
  }, [router, analytics])
  return null
}

function RootComponent() {
  return (
    <>
      <RouteTracker />
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton />
      <Suspense fallback={null}>
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </Suspense>
    </>
  )
}
