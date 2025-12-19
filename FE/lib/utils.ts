import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

export function getStatusLabel(status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled"): string {
  const labels: Record<typeof status, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
  }
  return labels[status]
}

export function getPaymentStatusLabel(status: "pending" | "paid" | "failed"): string {
  const labels: Record<typeof status, string> = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    failed: "Thất bại",
  }
  return labels[status]
}

export function getProductImageUrl(imagePath: string): string {
  if (!imagePath) return "/placeholder.svg"
  if (imagePath.startsWith("http")) return imagePath
  if (imagePath.startsWith("/")) return `${API_BASE_URL}${imagePath}`
  return `${API_BASE_URL}/${imagePath}`
}
