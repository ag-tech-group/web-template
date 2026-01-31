import { act } from "@testing-library/react"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"

import { routeTree } from "@/routeTree.gen"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"

interface RenderOptions {
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

export async function renderWithFileRoutes(options?: RenderOptions) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  const memoryHistory = createMemoryHistory({
    initialEntries: [options?.initialLocation ?? "/"],
  })

  const auth = options?.routerContext?.auth ?? defaultAuth

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
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  })

  const { rerender, ...rest } = result!

  return {
    ...rest,
    rerender: async () => {
      await act(async () => {
        rerender(
          <QueryClientProvider client={testQueryClient}>
            <ThemeProvider>
              <AuthProvider>
                <RouterProvider router={testRouter} />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        )
      })
    },
    router: testRouter,
    queryClient: testQueryClient,
    history: memoryHistory,
  }
}

// Keep backward-compatible alias
export const renderRoute = (route: string) =>
  renderWithFileRoutes({ initialLocation: route })
