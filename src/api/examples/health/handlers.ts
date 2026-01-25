import { http, HttpResponse } from "msw"
import { healthPath } from "@/api/examples/health/endpoints"

export const healthHandlers = [
  // Using wildcard pattern to match any baseUrl (e.g., /api/health, http://localhost/api/health)
  http.get(`*/${healthPath}`, () => {
    return HttpResponse.json({ status: "ok" })
  }),
]
