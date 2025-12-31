"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ordersApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import type { Order } from "@/lib/types"
import { getProductName, getProductImage } from "@/lib/product-helpers"
import Image from "next/image"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
}

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
}

const paymentStatusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
}

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!authLoading && isAuthenticated) {
        try {
          setIsLoading(true)
          const response = await ordersApi.getMyOrders()
          setOrders(response.orders)
        } catch (error) {
          logger.error("Failed to fetch orders:", error)
        } finally {
          setIsLoading(false)
        }
      } else if (!authLoading && !isAuthenticated) {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated, authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">Đang tải...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Vui lòng đăng nhập</h1>
            <p className="text-muted-foreground">Bạn cần đăng nhập để xem đơn hàng</p>
            <Link href="/login">
              <Button>Đăng nhập</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Lịch sử đơn hàng</h1>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
              <Link href="/products">
                <Button>Mua sắm ngay</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">Đơn hàng #{order._id.slice(-8).toUpperCase()}</h3>
                          <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                          <Badge variant="outline">{paymentStatusLabels[order.paymentStatus]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ngày đặt: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                        </p>
                        {order.shippingAddress && (
                          <p className="text-sm text-muted-foreground">Địa chỉ: {order.shippingAddress}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-primary text-lg">{formatCurrency(order.finalTotal)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.discount > 0 && `Đã giảm: ${formatCurrency(order.discount)}`}
                          </p>
                        </div>
                        <Link href={`/orders/${order._id}`}>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.orderItems.map((item, index) => {
                          const productName = getProductName(item)
                          const productImage = getProductImage(item)
                          return (
                            <div key={`${order._id}-${index}`} className="flex items-center gap-3">
                              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                <Image src={productImage} alt={productName} fill className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{productName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.color} x{item.quantity}
                                </p>
                                <p className="text-xs font-medium text-primary">{formatCurrency(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
