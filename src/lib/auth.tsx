import { useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { api, setOnUnauthorized } from "@/api/api"

const EMAIL_KEY = "app_auth_email"

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  email: string | null
  userId: string | null
  name: string | null
  login: (email: string) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_KEY)
  )
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  const clearState = useCallback(() => {
    localStorage.removeItem(EMAIL_KEY)
    setIsAuthenticated(false)
    setEmail(null)
    setUserId(null)
    setName(null)
    queryClient.clear()
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await api.post("auth/jwt/logout")
    } catch {
      // Clear state regardless of fetch success
    }
    clearState()
  }, [clearState])

  const login = useCallback((newEmail: string) => {
    localStorage.setItem(EMAIL_KEY, newEmail)
    setEmail(newEmail)
    setIsAuthenticated(true)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const user = await api
        .get("auth/me")
        .json<{ id: string; email: string; name: string | null }>()
      setIsAuthenticated(true)
      setEmail(user.email)
      setUserId(user.id)
      setName(user.name)
      localStorage.setItem(EMAIL_KEY, user.email)
    } catch {
      clearState()
    } finally {
      setIsLoading(false)
    }
  }, [clearState])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Re-validate auth when the user returns to the tab after being away
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkAuth()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [checkAuth])

  useEffect(() => {
    setOnUnauthorized(() => {
      clearState()
    })
  }, [clearState])

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      email,
      userId,
      name,
      login,
      logout,
      checkAuth,
    }),
    [isAuthenticated, isLoading, email, userId, name, login, logout, checkAuth]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
