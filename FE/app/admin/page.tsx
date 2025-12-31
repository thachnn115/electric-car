import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { products, orders, users, formatCurrency, getStatusLabel } from "@/lib/mock-data"

const stats = [
  {
    name: "Tổng doanh thu",
    value: formatCurrency(orders.reduce((sum, order) => sum + order.finalTotal, 0)),
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    name: "Đơn hàng",
    value: orders.length.toString(),
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    name: "Sản phẩm",
    value: products.length.toString(),
    change: "+2",
    trend: "up",
    icon: Package,
  },
  {
    name: "Người dùng",
    value: users.filter((u) => u.role === "user").length.toString(),
    change: "+5.1%",
    trend: "up",
    icon: Users,
  },
]

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function AdminDashboardPage() {
  const recentOrders = orders.slice(0, 5)
  const topProducts = products.slice(0, 5)

  return (
    <>
      <AdminHeader title="Dashboard" description="Tổng quan hệ thống" />

      <main className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                    {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
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
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-semibold">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Còn {product.stock} xe</p>
                    </div>
                    <p className="font-semibold text-primary">{formatCurrency(product.price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
