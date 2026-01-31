import { renderWithFileRoutes } from "@/test/renderers"
import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

describe("HomePage", () => {
  it("renders the main heading", async () => {
    await renderWithFileRoutes(<div />, { initialLocation: "/" })

    expect(
      screen.getByRole("heading", { name: /react stack/i })
    ).toBeInTheDocument()
  })

  it("renders navigation links", async () => {
    await renderWithFileRoutes(<div />, { initialLocation: "/" })

    expect(
      screen.getByRole("link", { name: /tanstack router/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /shadcn\/ui/i })
    ).toBeInTheDocument()
  })
})
