import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
        Page not found
      </p>
      <h1 className="text-primary text-7xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground text-base">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Button asChild>
        <Link to="/">Go back home</Link>
      </Button>
    </div>
  )
}
