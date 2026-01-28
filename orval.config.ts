import { defineConfig } from "orval"

const input = process.env.OPENAPI_URL || "http://localhost:8000/openapi.json"

export default defineConfig({
  // React Query hooks
  backend: {
    input,
    output: {
      mode: "tags-split",
      target: "./src/api/generated/hooks",
      schemas: "./src/api/generated/types",
      client: "react-query",
      httpClient: "fetch",
      override: {
        mutator: {
          path: "./src/api/orval-client.ts",
          name: "orvalClient",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
        zod: {
          strict: {
            response: true,
            body: true,
            param: true,
            query: true,
          },
        },
      },
    },
  },
  // Standalone Zod schemas (for form validation, manual use, etc.)
  // Note: React Query hooks above also have integrated Zod validation via zod.strict
  zod: {
    input,
    output: {
      mode: "tags-split",
      target: "./src/api/generated/zod",
      client: "zod",
    },
  },
  // MSW mock handlers
  msw: {
    input,
    output: {
      mode: "tags-split",
      target: "./src/api/generated/mocks",
      client: "msw",
    },
  },
})
