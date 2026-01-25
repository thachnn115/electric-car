"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Loader2, Calendar } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminApi } from "@/lib/api"
import { formatCurrency, getStatusLabel } from "@/lib/utils"
import type { AdminStatsResponse } from "@/lib/types"
import { getErrorMessage } from "@/lib/error-handler"
import { toast } from "sonner"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

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
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [filterType, setFilterType] = useState<string>("month")
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString())

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await adminApi.getStats({
          type: filterType,
          year: parseInt(selectedYear),
          month: parseInt(selectedMonth)
        })
        setStats(response)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [filterType, selectedYear, selectedMonth])

  const totals = stats?.totals ?? emptyTotals
  const chartData = stats?.chartData ?? []
  const recentOrders = stats?.recentOrders ?? []
  const topProducts = stats?.topProducts ?? []

  // Simplify revenue change calculation for now as dynamic periods make "previous" ambiguous without more data
  // Could be improved by fetching previous period data separately if needed
  const revenueChange = null

  const statCards = useMemo(
    () => [
      {
        name: "Tổng doanh thu",
        value: isLoading ? "--" : formatCurrency(totals.revenue),
        change: formatChangeLabel(revenueChange),
        trend: getTrend(revenueChange),
        icon: DollarSign,
      },
      {
        name: "Đơn hàng",
        value: isLoading ? "--" : totals.orders.toString(),
        change: "--",
        trend: "neutral" as Trend,
        icon: ShoppingCart,
      },
      {
        name: "Sản phẩm",
        value: isLoading ? "--" : totals.products.toString(),
        change: "--",
        trend: "neutral" as Trend,
        icon: Package,
      },
      {
        name: "Người dùng",
        value: isLoading ? "--" : totals.customers.toString(),
        change: "--",
        trend: "neutral" as Trend,
        icon: Users,
      },
    ],
    [isLoading, totals, revenueChange]
  )

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <>
      <AdminHeader title="Dashboard" description="Tổng quan hệ thống" />

      <main className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">Thống kê doanh thu</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Xem theo:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[110px] bg-background">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Ngày</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                  <SelectItem value="year">Năm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterType === "day" || filterType === "month") && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px] bg-background">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterType === "day" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px] bg-background">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      Tháng {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Stats Cards */}
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
                    {/* Hide change for now as logic is simplified */}
                    {/* <div className={`flex items-center gap-1 text-sm font-medium ${trendClass}`}>
                      {stat.change}
                      {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
                    </div> */}
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

        {/* Charts */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
            <CardDescription>
              {filterType === 'day' ? `Thống kê ngày trong tháng ${selectedMonth}/${selectedYear}` :
                filterType === 'month' ? `Thống kê tháng trong năm ${selectedYear}` :
                  `Thống kê theo năm`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => filterType === 'month' ? `T${value}` : `${value}`}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => {
                        if (filterType === 'month') return `Tháng ${label}`
                        if (filterType === 'day') return `Ngày ${label}`
                        return `Năm ${label}`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <p>Không có dữ liệu cho giai đoạn này.</p>
                  <p className="text-sm">Vui lòng thử chọn Năm hoặc Tháng khác.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                        <p className="text-sm text-muted-foreground">{product.quantitySold} đã bán</p>
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
