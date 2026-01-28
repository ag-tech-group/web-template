import type { HttpHandler } from "msw"

/**
 * Import generated MSW handlers after running `pnpm generate-api`
 * Example:
 *  import { getDefaultMock } from "@/api/generated/hooks/default/default.msw"
 *  import { getRacersMock } from "@/api/generated/hooks/racers/racers.msw"
 *  export const handlers: HttpHandler[] = [...getDefaultMock(), ...getRacersMock()]
 */

export const handlers: HttpHandler[] = []
