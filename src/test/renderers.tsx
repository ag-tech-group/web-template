import { act } from "@testing-library/react"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"

import { routeTree } from "@/routeTree.gen"

export async function renderRoute(route: string) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  const memoryHistory = createMemoryHistory({ initialEntries: [route] })

  const testRouter = createRouter({
    routeTree,
    history: memoryHistory,
    context: {
      queryClient: testQueryClient,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <QueryClientProvider client={testQueryClient}>
        <RouterProvider router={testRouter} />
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
            <RouterProvider router={testRouter} />
          </QueryClientProvider>
        )
      })
    },
    router: testRouter,
    queryClient: testQueryClient,
    history: memoryHistory,
  }
}
