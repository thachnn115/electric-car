import type { CartItem, Product } from "./types"
import { getProductImageUrl } from "./utils"

export function getProductId(item: CartItem): string {
  return typeof item.product === "string" ? item.product : item.product._id
}

export function getProductName(item: CartItem): string {
  return typeof item.product === "string" ? item.name : item.product.name
}

export function getProductImages(item: CartItem): string[] {
  return typeof item.product === "string" ? [] : item.product.images || []
}

export function getProductStock(item: CartItem): number {
  return typeof item.product === "string" ? 999 : item.product.stock || 0
}

export function getProductImage(item: CartItem): string {
  const images = getProductImages(item)
  return getProductImageUrl(item.image || images[0] || "")
}

export function calculateDiscountPercent(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= currentPrice || originalPrice === 0) return 0
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

export function hasDiscount(product: Product): boolean {
  return Boolean(product.originalPrice && product.originalPrice > product.price)
}
