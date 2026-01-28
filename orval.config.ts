import { defineConfig } from "orval"

export default defineConfig({
  backend: {
    input: process.env.OPENAPI_URL || "http://localhost:8000/openapi.json",
    output: {
      mode: "tags-split",
      target: "./src/api/generated",
      schemas: "./src/api/generated/schemas",
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
})
