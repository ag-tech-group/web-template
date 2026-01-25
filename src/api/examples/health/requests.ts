import { api } from "@/api/api"
import { healthPath } from "@/api/examples/health/endpoints"
import {
  healthResponseSchema,
  type HealthResponse,
} from "@/api/examples/health/schemas"
import { throwError } from "@/api/throw-error"

export async function healthRequest(): Promise<HealthResponse> {
  const response = await api
    .get(healthPath)
    .json<HealthResponse>()
    .catch((error) =>
      throwError({
        message: "Health request failed",
        error,
        logData: { path: healthPath },
      })
    )

  const parsed = healthResponseSchema.safeParse(response)
  if (!parsed.success) {
    throwError({
      message: "Health response validation failed",
      error: parsed.error,
      logData: { path: healthPath, response },
    })
  }

  return parsed.data
}
