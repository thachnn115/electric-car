export interface Product {
  _id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  shortDescription: string
  images: string[]
  colors: { name: string; hex: string; image: string }[]
  category: string | { _id: string; name: string; slug: string }
  specs: { label: string; value: string }[]
  stock: number
  rating: number
  reviews: number
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface CartItem {
  product: string | Product
  name: string
  price: number
  quantity: number
  color: string
  image: string
}

export interface Cart {
  _id: string
  user: string
  items: CartItem[]
  createdAt?: string
  updatedAt?: string
}

export interface Order {
  _id: string
  user: string | { _id: string; name: string; email: string }
  userName: string
  userEmail: string
  userPhone: string
  shippingAddress: string
  orderItems: CartItem[]
  subtotal: number
  discount: number
  discountCode: string
  shippingFee: number
  tax: number
  total: number
  finalTotal: number
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled"
  paymentMethod: string
  paymentStatus: "pending" | "paid" | "failed"
  paymentIntentID?: string
  createdAt?: string
  updatedAt?: string
}

export interface User {
  _id?: string
  userId?: string
  name: string
  email: string
  phone?: string
  address?: string
  avatar?: string
  gender?: string
  dateOfBirth?: string
  role: "admin" | "user"
  createdAt?: string
}

export interface Review {
  _id: string
  product: string | Product
  user: string | User
  rating: number
  title: string
  comment: string
  createdAt?: string
  updatedAt?: string
}

export interface Discount {
  _id: string
  code: string
  discountType: "percent" | "fixed"
  discountValue: number
  minOrder?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount?: number
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  [key: string]: T | number | string
}

export interface ProductsResponse {
  total_products: number
  product: Product[]
}

export interface CategoriesResponse {
  total_categories: number
  categories: Category[]
}

export interface CategoryProductsResponse {
  category: { id: string; name: string; slug: string }
  total_products: number
  products: Product[]
}

export interface CartResponse {
  cart: Cart
}

export interface OrderResponse {
  order: Order
}

export interface OrdersResponse {
  total_orders: number
  orders: Order[]
}

export interface AdminStatsTotals {
  revenue: number
  orders: number
  paidOrders: number
  products: number
  customers: number
  averageOrderValue: number
}

export interface AdminStatsResponse {
  totals: AdminStatsTotals
  orderStatusCounts: Record<Order["status"], number>
  revenueByMonth: Array<{ year: number; month: number; revenue: number; orders: number }>
  topProducts: Array<{
    productId: string
    name: string
    image: string
    quantitySold: number
    revenue: number
  }>
  recentOrders: Array<{
    id: string
    userName: string
    userEmail: string
    finalTotal: number
    status: Order["status"]
    paymentStatus: Order["paymentStatus"]
    createdAt: string
  }>
}

export interface ReviewsResponse {
  total_reviews: number
  reviews: Review[]
}

export interface CheckoutResponse {
  paymentUrl?: string
  orderId?: string
  paymentIntentID?: string
  order?: Order
  message?: string
}




