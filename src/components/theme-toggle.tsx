import { Moon, Monitor, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")
  }

  return (
    <Button variant="ghost" size="sm" onClick={cycle}>
      {theme === "light" && (
        <>
          <Sun className="h-4 w-4" /> Light
        </>
      )}
      {theme === "dark" && (
        <>
          <Moon className="h-4 w-4" /> Dark
        </>
      )}
      {theme === "system" && (
        <>
          <Monitor className="h-4 w-4" /> Auto
        </>
      )}
    </Button>
  )
}
