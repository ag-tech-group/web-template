import { Link } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  logger.error("Uncaught error in route component", {
    message: error.message,
    stack: error.stack,
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
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
