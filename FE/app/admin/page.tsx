"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminApi } from "@/lib/api"
import { formatCurrency, getStatusLabel } from "@/lib/utils"
import type { AdminStatsResponse } from "@/lib/types"
import { getErrorMessage } from "@/lib/error-handler"
import { toast } from "sonner"

type Trend = "up" | "down" | "neutral"

const emptyTotals = {
  revenue: 0,
  orders: 0,
  paidOrders: 0,
  products: 0,
  customers: 0,
  averageOrderValue: 0,
}

function getPercentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function getTrend(change: number | null): Trend {
  if (change === null || change === 0) return "neutral"
  return change > 0 ? "up" : "down"
}

function formatChangeLabel(change: number | null): string {
  if (change === null) return "--"
  const sign = change > 0 ? "+" : change < 0 ? "-" : ""
  return `${sign}${Math.abs(change).toFixed(1)}%`
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await adminApi.getStats()
        setStats(response)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const totals = stats?.totals ?? emptyTotals
  const revenueByMonth = stats?.revenueByMonth ?? []
  const recentOrders = stats?.recentOrders ?? []
  const topProducts = stats?.topProducts ?? []

  const revenueChange = useMemo(() => {
    if (revenueByMonth.length < 2) return null
    const current = revenueByMonth[revenueByMonth.length - 1]
    const previous = revenueByMonth[revenueByMonth.length - 2]
    return getPercentChange(current.revenue, previous.revenue)
  }, [revenueByMonth])

  const statCards = useMemo(
    () => [
      {
        name: "Tổng danh thu",
        value: isLoading ? "--" : formatCurrency(totals.revenue),
        change: formatChangeLabel(revenueChange),
        trend: getTrend(revenueChange),
        icon: DollarSign,
      },
      {
        name: "Đơn hàng",
        value: isLoading ? "--" : totals.orders.toString(),
        change: "--",
        trend: "neutral",
        icon: ShoppingCart,
      },
      {
        name: "Sản phẩm",
        value: isLoading ? "--" : totals.products.toString(),
        change: "--",
        trend: "neutral",
        icon: Package,
      },
      {
        name: "Người dùng",
        value: isLoading ? "--" : totals.customers.toString(),
        change: "--",
        trend: "neutral",
        icon: Users,
      },
    ],
    [isLoading, totals, revenueChange]
  )

  return (
    <>
      <AdminHeader title="Dashboard" description="Tổng quan hệ thống" />

      <main className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const trendClass =
              stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-muted-foreground"
            const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : null

            return (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${trendClass}`}>
                      {stat.change}
                      {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Đơn hàng gần đây</CardTitle>
              <a href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data</div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.id}</p>
                          <Badge className={statusColors[order.status]} variant="secondary">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.userName}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(order.finalTotal)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sản phẩm bán chạy</CardTitle>
              <a href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data</div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.productId || `${product.name}-${index}`} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-semibold">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Da ban {product.quantitySold}</p>
                      </div>
                      <p className="font-semibold text-primary">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
