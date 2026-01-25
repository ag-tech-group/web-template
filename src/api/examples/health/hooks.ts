import { queryOptions } from "@tanstack/react-query"
import { healthRequest } from "@/api/examples/health/requests"

export function healthQueryOptions() {
  return queryOptions({
    queryKey: ["health"],
    queryFn: healthRequest,
  })
}
