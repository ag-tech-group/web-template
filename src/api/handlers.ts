import { http, HttpResponse, type HttpHandler } from "msw"

/**
 * Import generated MSW handlers after running `pnpm generate-api`
 * Example:
 *  import { getDefaultMock } from "@/api/generated/hooks/default/default.msw"
 *  import { getNotesMock } from "@/api/generated/hooks/notes/notes.msw"
 *  export const handlers: HttpHandler[] = [...getDefaultMock(), ...getNotesMock()]
 */

export const handlers: HttpHandler[] = [
  // Return 401 for /v1/auth/me by default (unauthenticated)
  http.get("*/v1/auth/me", () => HttpResponse.json(null, { status: 401 })),
]
