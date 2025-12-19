"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { authApi, usersApi } from "./api"
import { storage } from "./storage"
import { handleApiError } from "./error-handler"
import { logger } from "./logger"
import { parseUser } from "./user-helpers"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
    address?: string
  }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function saveUser(user: User): void {
  storage.setUser(JSON.stringify(user))
}

function clearUser(): void {
  storage.removeUser()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await usersApi.getCurrentUser()
        setUser(response.user)
        saveUser(response.user)
      } catch {
        const savedUser = storage.getUser()
        if (savedUser) {
          const parsedUser = parseUser(savedUser)
          if (parsedUser) {
            setUser(parsedUser)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      setUser(response.user)
      saveUser(response.user)
    } catch (error) {
      throw handleApiError(error, "Đăng nhập thất bại")
    }
  }, [])

  const register = useCallback(
    async (data: {
      name: string
      email: string
      password: string
      phone?: string
      address?: string
    }) => {
      try {
        const response = await authApi.register(data)
        setUser(response.user)
        saveUser(response.user)
      } catch (error) {
        throw handleApiError(error, "Đăng ký thất bại")
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      logger.error("Logout failed:", error)
    } finally {
      setUser(null)
      clearUser()
    }
  }, [])

  const isAuthenticated = useMemo(() => !!user, [user])
  const isAdmin = useMemo(() => user?.role === "admin", [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
