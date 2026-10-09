// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import { Link } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Button, buttonVariants } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export function ErrorBoundary({ error, reset }: ErrorComponentProps) {
  logger.error("Uncaught error in route component", {
    // The router types `error` as unknown: anything can be thrown.
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
        Something went wrong
      </p>
      <h1 className="text-primary text-7xl font-bold tracking-tight">Error</h1>
      <p className="text-muted-foreground text-base">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </div>
  )
}
