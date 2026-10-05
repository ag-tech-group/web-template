// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, type FormEvent } from "react"
import { describe, expect, it, vi } from "vitest"
import { Button } from "./button"

describe("Button", () => {
  it("stays focusable but inert while loading", async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    )

    const button = screen.getByRole("button", { name: /save/i })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).not.toHaveAttribute("disabled")
    expect(button.querySelector(".animate-spin")).toBeInTheDocument()

    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard("{Enter}[Space]")

    expect(button).toHaveFocus()
    expect(onClick).not.toHaveBeenCalled()
  })

  // Without a native `disabled`, the browser no longer blocks implicit
  // submission (Enter in a field clicks the form's submit button), so a
  // loading button must cancel that click itself or the form double-submits.
  it("does not submit its form while loading", async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <input aria-label="Name" />
        <Button type="submit">Save</Button>
      </form>
    )

    await userEvent.type(screen.getByLabelText("Name"), "a{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(
      <form onSubmit={onSubmit}>
        <input aria-label="Name" />
        <Button type="submit" loading>
          Save
        </Button>
      </form>
    )

    await userEvent.type(screen.getByLabelText("Name"), "b{Enter}")
    await userEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("keeps a plain disabled button natively disabled", () => {
    render(<Button disabled>Save</Button>)

    const button = screen.getByRole("button", { name: /save/i })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute("aria-disabled")
  })

  // Base UI triggers compose through `render={<Button />}` and pass their own
  // ref; it must reach the DOM node alongside the ref Button keeps internally.
  it("forwards object and callback refs to the button element", () => {
    const objectRef = createRef<HTMLButtonElement>()
    const callbackRef = vi.fn()

    render(
      <>
        <Button ref={objectRef}>Object</Button>
        <Button ref={callbackRef}>Callback</Button>
      </>
    )

    expect(objectRef.current).toBe(
      screen.getByRole("button", { name: "Object" })
    )
    expect(callbackRef).toHaveBeenCalledWith(
      screen.getByRole("button", { name: "Callback" })
    )
  })
})
