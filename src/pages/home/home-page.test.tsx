import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/utils"
import { HomePage } from "./home-page"

describe("HomePage", () => {
  it("renders the main heading", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("heading", { name: /react modern stack/i })
    ).toBeInTheDocument()
  })

  it("renders navigation links", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("link", { name: /tanstack router/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /shadcn\/ui/i })).toBeInTheDocument()
  })
})
