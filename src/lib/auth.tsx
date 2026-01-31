import { useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { baseUrl, setOnUnauthorized } from "@/api/api"

const EMAIL_KEY = "app_auth_email"

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  email: string | null
  userId: string | null
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

  const clearState = useCallback(() => {
    localStorage.removeItem(EMAIL_KEY)
    setIsAuthenticated(false)
    setEmail(null)
    setUserId(null)
    queryClient.clear()
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await fetch(`${baseUrl}/auth/jwt/logout`, {
        method: "POST",
        credentials: "include",
      })
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
      const res = await fetch(`${baseUrl}/auth/me`, {
        credentials: "include",
      })
      if (res.ok) {
        const user = await res.json()
        setIsAuthenticated(true)
        setEmail(user.email)
        setUserId(user.id)
        localStorage.setItem(EMAIL_KEY, user.email)
      } else {
        clearState()
      }
    } catch {
      clearState()
    } finally {
      setIsLoading(false)
    }
  }, [clearState])

  useEffect(() => {
    checkAuth()
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
      login,
      logout,
      checkAuth,
    }),
    [isAuthenticated, isLoading, email, userId, login, logout, checkAuth]
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
