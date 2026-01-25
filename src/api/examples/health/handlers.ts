import { EXAMPLE_HEALTH_ENDPOINT } from "@/api/examples/health/endpoints"
import { http, HttpResponse } from "msw"

export const healthHandlers = [
  http.get(EXAMPLE_HEALTH_ENDPOINT, () => {
    return HttpResponse.json({ status: "ok" })
  }),
]
