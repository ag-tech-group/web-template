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
      },
    },
  },
  // Zod schemas for runtime validation
  zod: {
    input,
    output: {
      mode: "tags-split",
      target: "./src/api/generated/zod",
      client: "zod",
    },
  },
})
