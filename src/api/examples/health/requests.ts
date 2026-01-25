import { api } from "@/api/api"
import { EXAMPLE_HEALTH_ENDPOINT } from "@/api/examples/health/endpoints"
import {
  healthResponseSchema,
  type HealthResponse,
} from "@/api/examples/health/schemas"
import { throwError } from "@/api/throw-error"

export async function healthRequest(): Promise<HealthResponse> {
  const response = await api
    .get(EXAMPLE_HEALTH_ENDPOINT)
    .json<HealthResponse>()
    .catch((error) =>
      throwError({
        message: "Health request failed",
        error,
        logData: { endpoint: EXAMPLE_HEALTH_ENDPOINT },
      })
    )

  const parsed = healthResponseSchema.safeParse(response)
  if (!parsed.success) {
    throwError({
      message: "Health response validation failed",
      error: parsed.error,
      logData: { endpoint: EXAMPLE_HEALTH_ENDPOINT, response },
    })
  }

  return parsed.data
}
