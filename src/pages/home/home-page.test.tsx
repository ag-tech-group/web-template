import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { renderRoute } from "@/test/renderers"

describe("HomePage", () => {
  it("renders the main heading", async () => {
    await renderRoute("/")

    expect(
      screen.getByRole("heading", { name: /react modern stack/i })
    ).toBeInTheDocument()
  })

  it("renders navigation links", async () => {
    await renderRoute("/")

    expect(
      screen.getByRole("link", { name: /tanstack router/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /shadcn\/ui/i })
    ).toBeInTheDocument()
  })
})
