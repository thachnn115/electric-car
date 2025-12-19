"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { cartApi } from "./api"
import { handleApiError } from "./error-handler"
import { logger } from "./logger"
import type { CartItem, Product } from "./types"
import { useAuth } from "./auth-context"

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity: number, color: string) => Promise<void>
  removeItem: (productId: string, color: string) => Promise<void>
  updateQuantity: (productId: string, color: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  total: number
  itemCount: number
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const AUTH_REQUIRED_MESSAGE = "Vui lòng đăng nhập"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await cartApi.get()
      setItems(response.cart.items || [])
    } catch (error) {
      logger.error("Failed to fetch cart:", error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addItem = useCallback(
    async (product: Product, quantity: number, color: string) => {
      if (!isAuthenticated) {
        throw new Error(`${AUTH_REQUIRED_MESSAGE} để thêm sản phẩm vào giỏ hàng`)
      }

      try {
        await cartApi.addItem(product._id, quantity, color)
        await refreshCart()
      } catch (error) {
        throw handleApiError(error, "Không thể thêm sản phẩm vào giỏ hàng")
      }
    },
    [isAuthenticated, refreshCart]
  )

  const removeItem = useCallback(
    async (productId: string, color: string) => {
      if (!isAuthenticated) {
        throw new Error(AUTH_REQUIRED_MESSAGE)
      }

      try {
        await cartApi.removeItem(productId, color)
        await refreshCart()
      } catch (error) {
        throw handleApiError(error, "Không thể xóa sản phẩm")
      }
    },
    [isAuthenticated, refreshCart]
  )

  const updateQuantity = useCallback(
    async (productId: string, color: string, quantity: number) => {
      if (!isAuthenticated) {
        throw new Error(AUTH_REQUIRED_MESSAGE)
      }

      if (quantity <= 0) {
        await removeItem(productId, color)
        return
      }

      try {
        await cartApi.updateItem(productId, color, quantity)
        await refreshCart()
      } catch (error) {
        throw handleApiError(error, "Không thể cập nhật số lượng")
      }
    },
    [isAuthenticated, refreshCart, removeItem]
  )

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      return
    }

    try {
      await cartApi.clear()
      await refreshCart()
    } catch (error) {
      logger.error("Failed to clear cart:", error)
    }
  }, [isAuthenticated, refreshCart])

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
        total,
        itemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
