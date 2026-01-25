import type { CartItem, Product } from "./types"
import { getProductImageUrl } from "./utils"

function isProduct(product: string | Product | null | undefined): product is Product {
  return product !== null && product !== undefined && typeof product !== "string"
}

export function getProductId(item: CartItem): string {
  if (typeof item.product === "string") {
    return item.product
  }
  if (isProduct(item.product)) {
    return item.product._id
  }
  return ""
}

export function getProductName(item: CartItem): string {
  if (isProduct(item.product)) {
    return item.product.name
  }
  return item.name || ""
}

export function getProductImages(item: CartItem): string[] {
  if (isProduct(item.product)) {
    return item.product.images || []
  }
  return []
}

export function getProductStock(item: CartItem): number {
  if (isProduct(item.product)) {
    return item.product.stock || 0
  }
  return 999
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

export function getColorPrice(color: Product["colors"][0] | undefined, productPrice: number): number {
  if (color?.price !== undefined && color.price !== null) {
    return color.price
  }
  return productPrice
}

export function getColorOriginalPrice(color: Product["colors"][0] | undefined, productOriginalPrice?: number): number | undefined {
  if (color?.originalPrice !== undefined && color.originalPrice !== null) {
    return color.originalPrice
  }
  return productOriginalPrice
}

export function hasColorDiscount(color: Product["colors"][0] | undefined, product: Product): boolean {
  const colorPrice = getColorPrice(color, product.price)
  const colorOriginalPrice = getColorOriginalPrice(color, product.originalPrice)
  return Boolean(colorOriginalPrice && colorOriginalPrice > colorPrice)
}

// Product form validation constants
export const PRODUCT_VALIDATION = {
  MAX_NAME_LENGTH: 150,
  MAX_SHORT_DESCRIPTION_LENGTH: 250,
  MAX_DESCRIPTION_LENGTH: 3000,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  HEX_COLOR_REGEX: /^#[0-9A-Fa-f]{6}$/,
  HEX_COLOR_PARTIAL_REGEX: /^#[0-9A-Fa-f]{0,6}$/,
} as const

// Product form validation functions
export interface ProductFormData {
  name: string
  price: string
  originalPrice: string
  shortDescription: string
  description: string
  category: string
  stock: string
}

export interface ColorFormData {
  id: string
  name: string
  hex: string
  image: File | null
  preview?: string
  price?: string
  originalPrice?: string
}

export interface SpecFormData {
  id: string
  label: string
  value: string
}

export function validateImageFile(file: File): string | null {
  if (!PRODUCT_VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type as "image/jpeg" | "image/jpg" | "image/png" | "image/webp")) {
    return "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP"
  }
  if (file.size > PRODUCT_VALIDATION.MAX_IMAGE_SIZE) {
    return "Kích thước ảnh không được vượt quá 5MB"
  }
  return null
}

export function normalizeHexColor(value: string): string {
  let hexValue = value.trim()
  if (!hexValue.startsWith("#")) {
    hexValue = `#${hexValue}`
  }
  return hexValue
}

export function isValidHexColor(value: string): boolean {
  return PRODUCT_VALIDATION.HEX_COLOR_REGEX.test(value)
}

export function isValidPartialHexColor(value: string): boolean {
  return PRODUCT_VALIDATION.HEX_COLOR_PARTIAL_REGEX.test(value)
}

export function validateProductForm(
  formData: ProductFormData,
  galleryImages: File[],
  galleryPreviews: string[],
  colors: ColorFormData[],
): string | null {
  if (!formData.name || formData.name.trim().length === 0) {
    return "Vui lòng nhập tên sản phẩm"
  }
  if (formData.name.trim().length > PRODUCT_VALIDATION.MAX_NAME_LENGTH) {
    return `Tên sản phẩm không được vượt quá ${PRODUCT_VALIDATION.MAX_NAME_LENGTH} ký tự`
  }

  if (!formData.price || formData.price.trim().length === 0) {
    return "Vui lòng nhập giá bán"
  }
  const price = Number(formData.price)
  if (Number.isNaN(price) || price < 0) {
    return "Giá bán phải là số dương"
  }

  if (formData.originalPrice && formData.originalPrice.trim().length > 0) {
    const originalPrice = Number(formData.originalPrice)
    if (Number.isNaN(originalPrice) || originalPrice < 0) {
      return "Giá gốc phải là số dương"
    }
    if (originalPrice <= price) {
      return "Giá gốc phải lớn hơn giá bán"
    }
  }

  if (!formData.shortDescription || formData.shortDescription.trim().length === 0) {
    return "Vui lòng nhập mô tả ngắn"
  }
  if (formData.shortDescription.trim().length > PRODUCT_VALIDATION.MAX_SHORT_DESCRIPTION_LENGTH) {
    return `Mô tả ngắn không được vượt quá ${PRODUCT_VALIDATION.MAX_SHORT_DESCRIPTION_LENGTH} ký tự`
  }

  if (!formData.description || formData.description.trim().length === 0) {
    return "Vui lòng nhập mô tả chi tiết"
  }
  if (formData.description.trim().length > PRODUCT_VALIDATION.MAX_DESCRIPTION_LENGTH) {
    return `Mô tả chi tiết không được vượt quá ${PRODUCT_VALIDATION.MAX_DESCRIPTION_LENGTH} ký tự`
  }

  if (!formData.category) {
    return "Vui lòng chọn danh mục"
  }

  if (!formData.stock || formData.stock.trim().length === 0) {
    return "Vui lòng nhập số lượng tồn kho"
  }
  const stock = Number(formData.stock)
  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    return "Số lượng tồn kho phải là số nguyên dương"
  }

  if (galleryImages.length === 0 && galleryPreviews.length === 0) {
    return "Vui lòng thêm ít nhất một ảnh sản phẩm"
  }

  const validColors = colors.filter((c) => {
    const hasName = c.name && c.name.trim().length > 0
    const hasHex = c.hex && isValidHexColor(c.hex)
    const hasImage = c.image || c.preview
    return hasName && hasHex && hasImage
  })

  if (validColors.length === 0) {
    return "Vui lòng thêm ít nhất một màu với đầy đủ tên, mã màu (hex) và ảnh"
  }

  const incompleteColors = colors.filter((c) => {
    const hasName = c.name && c.name.trim().length > 0
    const hasHex = c.hex && isValidHexColor(c.hex)
    const hasImage = c.image || c.preview
    const hasAnyField = hasName || hasHex || hasImage
    const hasAllFields = hasName && hasHex && hasImage
    return hasAnyField && !hasAllFields
  })

  if (incompleteColors.length > 0) {
    return "Mỗi màu phải có đầy đủ tên, mã màu (hex) và ảnh. Vui lòng xóa các màu chưa hoàn chỉnh hoặc điền đầy đủ thông tin."
  }

  // For new products, ensure all colors have image files (not just preview URLs)
  // This is validated in handleSave for create operations

  return null
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string)
      } else {
        reject(new Error("Failed to read file"))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getStockBadgeVariant(stock: number): "secondary" | "outline" | "destructive" {
  if (stock > 5) return "secondary"
  if (stock > 0) return "outline"
  return "destructive"
}




