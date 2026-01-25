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
const GUEST_CART_KEY = "guest_cart"

const saveGuestCart = (items: CartItem[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
    } catch (error) {
      logger.error("Failed to save guest cart:", error)
    }
  }
}

const loadGuestCart = (): CartItem[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      logger.error("Failed to load guest cart:", error)
    }
  }
  return []
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  const refreshCart = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) {
      const guestItems = loadGuestCart()
      setItems(guestItems)
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
      }
      const response = await cartApi.get()
      setItems(response.cart.items || [])
    } catch (error) {
      logger.error("Failed to fetch cart:", error)
      setItems([])
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  useEffect(() => {
    if (isAuthenticated) {
      const guestItems = loadGuestCart()
      if (guestItems.length > 0) {
        const mergeGuestCart = async () => {
          try {
            for (const item of guestItems) {
              const productId = typeof item.product === "string" ? item.product : item.product._id
              try {
                await cartApi.addItem(productId, item.quantity, item.color)
              } catch (error) {
                logger.error(`Failed to merge cart item ${productId}:`, error)
              }
            }
            localStorage.removeItem(GUEST_CART_KEY)
            await refreshCart()
          } catch (error) {
            logger.error("Failed to merge guest cart:", error)
          }
        }
        void mergeGuestCart()
      }
    } else {
      const guestItems = loadGuestCart()
      setItems(guestItems)
    }
  }, [isAuthenticated, refreshCart])

  const addItem = useCallback(
    async (product: Product, quantity: number, color: string) => {
      if (!isAuthenticated) {
        const selectedColor = product.colors?.find((c) => c.name === color)
        const itemPrice = selectedColor?.price !== undefined && selectedColor?.price !== null
          ? selectedColor.price
          : (product.price || 0)

        setItems((prevItems) => {
          const existingIndex = prevItems.findIndex(
            (item) => {
              const itemProductId = typeof item.product === "string" ? item.product : item.product._id
              return itemProductId === product._id && item.color === color
            }
          )

          let newItems: CartItem[]
          if (existingIndex >= 0) {
            newItems = prevItems.map((item, idx) =>
              idx === existingIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          } else {
            newItems = [
              ...prevItems,
              {
                product: product._id,
                name: product.name,
                price: itemPrice,
                quantity,
                color,
                image: product.images?.[0] || "",
              },
            ]
          }
          saveGuestCart(newItems)
          return newItems
        })
        return
      }

      try {
        const response = await cartApi.addItem(product._id, quantity, color)
        if (response.cart?.items) {
          setItems(response.cart.items)
        }
      } catch (error) {
        throw handleApiError(error, "Không thể thêm sản phẩm vào giỏ hàng")
      }
    },
    [isAuthenticated]
  )

  const removeItem = useCallback(
    async (productId: string, color: string) => {
      if (!isAuthenticated) {
        setItems((prevItems) => {
          const newItems = prevItems.filter((item) => {
            const itemProductId = typeof item.product === "string" ? item.product : item.product._id
            return !(itemProductId === productId && item.color === color)
          })
          saveGuestCart(newItems)
          return newItems
        })
        return
      }

      setItems((prevItems) =>
        prevItems.filter((item) => {
          const itemProductId = typeof item.product === "string" ? item.product : item.product._id
          return !(itemProductId === productId && item.color === color)
        })
      )

      try {
        const response = await cartApi.removeItem(productId, color)
        if (response.cart?.items) {
          setItems(response.cart.items)
        }
      } catch (error) {
        try {
          const response = await cartApi.get()
          setItems(response.cart.items || [])
        } catch {
        }
        throw handleApiError(error, "Không thể xóa sản phẩm")
      }
    },
    [isAuthenticated]
  )

  const updateQuantity = useCallback(
    async (productId: string, color: string, quantity: number) => {
      if (!isAuthenticated) {
        if (quantity <= 0) {
          await removeItem(productId, color)
          return
        }

        setItems((prevItems) => {
          const newItems = prevItems.map((item) => {
            const itemProductId = typeof item.product === "string" ? item.product : item.product._id
            if (itemProductId === productId && item.color === color) {
              return { ...item, quantity }
            }
            return item
          })
          saveGuestCart(newItems)
          return newItems
        })
        return
      }

      if (quantity <= 0) {
        await removeItem(productId, color)
        return
      }

      setItems((prevItems) =>
        prevItems.map((item) => {
          const itemProductId = typeof item.product === "string" ? item.product : item.product._id
          if (itemProductId === productId && item.color === color) {
            return { ...item, quantity }
          }
          return item
        })
      )

      try {
        const response = await cartApi.updateItem(productId, color, quantity)
        if (response.cart?.items) {
          setItems(response.cart.items)
        }
      } catch (error) {
        try {
          const response = await cartApi.get()
          setItems(response.cart.items || [])
        } catch {
        }
        throw handleApiError(error, "Không thể cập nhật số lượng")
      }
    },
    [isAuthenticated, removeItem]
  )

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      saveGuestCart([])
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
