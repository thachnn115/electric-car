"use client"

import { useState, useEffect, use } from "react"
import { notFound, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ordersApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import { getProductName, getProductImage } from "@/lib/product-helpers"
import type { Order } from "@/lib/types"
import { toast } from "sonner"
import { ArrowLeft, Package, MapPin, Phone, Mail, Calendar, CreditCard, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface OrderPageProps {
  readonly params: Promise<{ id: string }>
}

const statusConfig = {
  pending: { label: "Chờ xử lý", variant: "secondary" as const },
  confirmed: { label: "Đã xác nhận", variant: "default" as const },
  shipping: { label: "Đang giao hàng", variant: "default" as const },
  delivered: { label: "Đã giao hàng", variant: "default" as const },
  cancelled: { label: "Đã hủy", variant: "destructive" as const },
}

const paymentStatusConfig = {
  pending: { label: "Chờ thanh toán", variant: "secondary" as const },
  paid: { label: "Đã thanh toán", variant: "default" as const },
  failed: { label: "Thanh toán thất bại", variant: "destructive" as const },
}

export default function OrderDetailPage({ params }: OrderPageProps) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true)
        // Try to get order detail - if user is not admin, try to get from my orders
        try {
          const response = await ordersApi.getById(resolvedParams.id)
          setOrder(response.order)
        } catch (error) {
          // If getById fails (might require admin), try to get from user's orders
          const myOrdersResponse = await ordersApi.getMyOrders()
          const foundOrder = myOrdersResponse.orders.find((o) => o._id === resolvedParams.id)
          if (foundOrder) {
            setOrder(foundOrder)
          } else {
            throw new Error("Không tìm thấy đơn hàng")
          }
        }
      } catch (error) {
        toast.error(getErrorMessage(error) || "Không thể tải thông tin đơn hàng")
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [resolvedParams.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Đang tải thông tin đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    notFound()
  }

  const statusInfo = statusConfig[order.status]
  const paymentInfo = paymentStatusConfig[order.paymentStatus]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/orders"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại đơn hàng
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Chi tiết đơn hàng</h1>
                <p className="text-muted-foreground mt-1">Mã đơn hàng: {order._id}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                        <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image
                            src={getProductImage(item)}
                            alt={getProductName(item)}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{getProductName(item)}</h3>
                          <p className="text-sm text-muted-foreground mb-2">Màu: {item.color}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Số lượng: {item.quantity}</span>
                            <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Địa chỉ giao hàng</p>
                    <p className="text-muted-foreground">{order.shippingAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Người nhận</p>
                    <p className="text-muted-foreground">{order.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Số điện thoại</p>
                    <p className="text-muted-foreground">{order.userPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="text-muted-foreground">{order.userEmail}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phí vận chuyển</span>
                      <span>{formatCurrency(order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Thuế</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatCurrency(order.finalTotal)}</span>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>Phương thức: {order.paymentMethod || "Chưa xác định"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
