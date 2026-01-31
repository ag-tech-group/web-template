import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { act, render, type RenderOptions } from "@testing-library/react"
import React from "react"

import { routeTree } from "@/routeTree.gen"

interface RenderWithFileRoutesOptions extends Omit<RenderOptions, "wrapper"> {
  initialLocation?: string
  routerContext?: {
    auth?: {
      isAuthenticated: boolean
      isLoading: boolean
      email: string | null
      userId: string | null
      login: (email: string) => void
      logout: () => Promise<void>
      checkAuth: () => Promise<void>
    }
  }
}

const defaultAuth = {
  isAuthenticated: true,
  isLoading: false,
  email: "test@example.com",
  userId: "test-user-id",
  login: () => {},
  logout: async () => {},
  checkAuth: async () => {},
}

export async function renderWithFileRoutes(
  ui: React.ReactElement,
  {
    initialLocation = "/",
    routerContext,
    ...renderOptions
  }: RenderWithFileRoutesOptions = {}
) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  const memoryHistory = createMemoryHistory({
    initialEntries: [initialLocation],
  })

  const auth = routerContext?.auth ?? defaultAuth

  const testRouter = createRouter({
    routeTree,
    history: memoryHistory,
    context: {
      queryClient: testQueryClient,
      auth,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingMinMs: 0,
  })

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={testRouter} />
            {ui}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>,
      renderOptions
    )
  })

  return {
    ...result!,
    router: testRouter,
    queryClient: testQueryClient,
    history: memoryHistory,
  }
}
