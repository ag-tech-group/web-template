import { Button } from "@/components/ui/button"

export function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">React Stack</h1>
      <p className="text-muted-foreground max-w-md text-center">
        A production-ready template with React 19, TanStack Router, TanStack
        Query, shadcn/ui, and Tailwind CSS v4.
      </p>
      <div className="flex gap-4">
        <Button variant="link" asChild>
          <a
            href="https://tanstack.com/router"
            target="_blank"
            rel="noopener noreferrer"
          >
            TanStack Router
          </a>
        </Button>
        <Button variant="link" asChild>
          <a
            href="https://ui.shadcn.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            shadcn/ui
          </a>
        </Button>
      </div>
    </div>
  )
}
