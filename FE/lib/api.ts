import type {
  Product,
  ProductsResponse,
  Category,
  CategoriesResponse,
  CategoryProductsResponse,
  CartResponse,
  Order,
  OrdersResponse,
  Review,
  ReviewsResponse,
  CheckoutResponse,
  User,
  Discount,
  AdminStatsResponse,
} from "./types"
import { API_BASE_URL } from "./constants"

interface ApiError {
  msg?: string
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const isFormData = options.body instanceof FormData
  const defaultHeaders: HeadersInit = isFormData ? {} : { "Content-Type": "application/json" }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ msg: "Có lỗi xảy ra" }))
    throw new Error(error.msg || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const productsApi = {
  getAll: (params?: { category?: string }): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.category) queryParams.append("category", params.category)
    const queryString = queryParams.toString()
    const endpoint = queryString ? `/api/v1/products?${queryString}` : "/api/v1/products"
    return fetchApi<ProductsResponse>(endpoint)
  },

  getById: (id: string): Promise<{ product: Product }> =>
    fetchApi<{ product: Product }>(`/api/v1/products/${id}`),

  getReviews: (id: string): Promise<ReviewsResponse> =>
    fetchApi<ReviewsResponse>(`/api/v1/products/${id}/reviews`),

  getAllAdmin: (): Promise<{ total_products: number; products: Product[] }> =>
    fetchApi<{ total_products: number; products: Product[] }>("/api/v1/products/admin"),

  searchAdmin: (params: {
    q?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }): Promise<{ total_products: number; products: Product[] }> => {
    const queryParams = new URLSearchParams()
    if (params.q) queryParams.append("q", params.q)
    if (params.category) queryParams.append("category", params.category)
    if (params.minPrice !== undefined) queryParams.append("minPrice", params.minPrice.toString())
    if (params.maxPrice !== undefined) queryParams.append("maxPrice", params.maxPrice.toString())
    if (params.inStock !== undefined) queryParams.append("inStock", params.inStock.toString())
    const queryString = queryParams.toString()
    const endpoint = queryString ? `/api/v1/products/admin/search?${queryString}` : "/api/v1/products/admin/search"
    return fetchApi<{ total_products: number; products: Product[] }>(endpoint)
  },

  create: (data: FormData): Promise<{ product: Product }> =>
    fetchApi<{ product: Product }>("/api/v1/products", {
      method: "POST",
      headers: {},
      body: data,
    }),

  update: (id: string, data: Partial<Product>): Promise<{ product: Product }> =>
    fetchApi<{ product: Product }>(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateWithFormData: (id: string, data: FormData): Promise<{ product: Product }> =>
    fetchApi<{ product: Product }>(`/api/v1/products/${id}`, {
      method: "PATCH",
      headers: {},
      body: data,
    }),

  delete: (id: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/products/${id}`, {
      method: "DELETE",
    }),

  uploadImage: (file: File): Promise<{ image: string }> => {
    const formData = new FormData()
    formData.append("image", file)
    return fetchApi<{ image: string }>("/api/v1/products/uploadImage", {
      method: "POST",
      headers: {},
      body: formData,
    })
  },
}

export const categoriesApi = {
  getAll: (): Promise<CategoriesResponse> =>
    fetchApi<CategoriesResponse>("/api/v1/public/categories"),

  getProductsByCategory: (slug: string): Promise<CategoryProductsResponse> =>
    fetchApi<CategoryProductsResponse>(`/api/v1/public/categories/${slug}/products`),

  getAllAdmin: (): Promise<CategoriesResponse> =>
    fetchApi<CategoriesResponse>("/api/v1/categories"),

  getById: (id: string): Promise<{ category: Category }> =>
    fetchApi<{ category: Category }>(`/api/v1/categories/${id}`),

  create: (data: { name: string; slug?: string; description?: string }): Promise<{ category: Category }> =>
    fetchApi<{ category: Category }>("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; slug?: string; description?: string }): Promise<{ category: Category }> =>
    fetchApi<{ category: Category }>(`/api/v1/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/categories/${id}`, {
      method: "DELETE",
    }),
}

export const cartApi = {
  get: (): Promise<CartResponse> => fetchApi<CartResponse>("/api/v1/cart"),

  addItem: (productId: string, quantity: number, color: string): Promise<CartResponse> =>
    fetchApi<CartResponse>("/api/v1/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, color }),
    }),

  updateItem: (productId: string, color: string, quantity: number): Promise<CartResponse> =>
    fetchApi<CartResponse>("/api/v1/cart", {
      method: "PATCH",
      body: JSON.stringify({ productId, color, quantity }),
    }),

  removeItem: (productId: string, color: string): Promise<CartResponse> =>
    fetchApi<CartResponse>("/api/v1/cart/item", {
      method: "DELETE",
      body: JSON.stringify({ productId, color }),
    }),

  clear: (): Promise<CartResponse> =>
    fetchApi<CartResponse>("/api/v1/cart", {
      method: "DELETE",
    }),
}

export const authApi = {
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
    address?: string
    avatar?: string
    gender?: string
    dateOfBirth?: string
  }): Promise<{ user: User; msg?: string }> =>
    fetchApi<{ user: User; msg?: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string): Promise<{ user: User; msg: string }> =>
    fetchApi<{ user: User; msg: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: (): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>("/api/v1/auth/logout", {
      method: "GET",
    }),
}

export const usersApi = {
  getCurrentUser: (): Promise<{ user: User }> =>
    fetchApi<{ user: User }>("/api/v1/users/showMe"),

  updateUser: (data: {
    name?: string
    email?: string
    phone?: string
    address?: string
    avatar?: string
    gender?: string
    dateOfBirth?: string
  }): Promise<{ user: User }> =>
    fetchApi<{ user: User }>("/api/v1/users/updateUser", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updatePassword: (oldPassword: string, newPassword: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>("/api/v1/users/updateUserPassword", {
      method: "PATCH",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  getAll: (): Promise<{ total_users: number; users: User[] }> =>
    fetchApi<{ total_users: number; users: User[] }>("/api/v1/users"),

  getById: (id: string): Promise<{ user: User }> =>
    fetchApi<{ user: User }>(`/api/v1/users/${id}`),

  createAdmin: (data: {
    name: string
    email: string
    password: string
    role?: "admin" | "user"
    phone?: string
    address?: string
  }): Promise<{ user: User }> =>
    fetchApi<{ user: User }>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAdmin: (id: string, data: {
    name?: string
    email?: string
    role?: "admin" | "user"
    phone?: string
    address?: string
  }): Promise<{ user: User }> =>
    fetchApi<{ user: User }>(`/api/v1/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAdmin: (id: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/users/${id}`, {
      method: "DELETE",
    }),
}

export const ordersApi = {
  getAll: (): Promise<OrdersResponse> => fetchApi<OrdersResponse>("/api/v1/orders"),

  getMyOrders: (): Promise<OrdersResponse> =>
    fetchApi<OrdersResponse>("/api/v1/orders/showAllMyOrders"),

  getById: (id: string): Promise<{ order: Order }> =>
    fetchApi<{ order: Order }>(`/api/v1/orders/${id}`),

  create: (data: {
    orderItems: Array<{ productId: string; quantity: number; color: string }>
    subtotal: number
    discount?: number
    shippingFee?: number
    tax?: number
    total: number
    finalTotal: number
    shippingAddress: string
    paymentMethod?: string
    userPhone?: string
  }): Promise<{ order: Order }> =>
    fetchApi<{ order: Order }>("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { status?: Order["status"]; paymentStatus?: Order["paymentStatus"] }): Promise<{ order: Order }> =>
    fetchApi<{ order: Order }>(`/api/v1/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/orders/${id}`, {
      method: "DELETE",
    }),

  createOfflineAdmin: (data: {
    items: Array<{ productId: string; quantity: number; color: string }>
    discountCode?: string
    userId?: string
    userName: string
    userEmail: string
    userPhone?: string
    shippingAddress: string
    paymentStatus?: "pending" | "paid" | "failed"
    status?: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled"
    paymentMethod?: string
  }): Promise<{ order: Order }> =>
    fetchApi<{ order: Order }>("/api/v1/orders/admin/offline", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

export const adminApi = {
  getStats: (params?: { type?: string; year?: number; month?: number }): Promise<AdminStatsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append("type", params.type)
    if (params?.year) queryParams.append("year", params.year.toString())
    if (params?.month) queryParams.append("month", params.month.toString())
    const queryString = queryParams.toString()
    const endpoint = queryString ? `/api/v1/admin/stats?${queryString}` : "/api/v1/admin/stats"
    return fetchApi<AdminStatsResponse>(endpoint)
  },
}

export const checkoutApi = {
  createOrder: (data: {
    discountCode?: string
    paymentMethod?: string
    userPhone?: string
    shippingAddress?: string
  }): Promise<CheckoutResponse> =>
    fetchApi<CheckoutResponse>("/api/v1/checkout/vnpay", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createGuestOrder: (data: {
    items: Array<{
      productId: string
      name: string
      price: number
      quantity: number
      color: string
      image?: string
    }>
    discountCode?: string
    paymentMethod?: string
    userName: string
    userEmail: string
    userPhone: string
    shippingAddress: string
  }): Promise<CheckoutResponse> =>
    fetchApi<CheckoutResponse>("/api/v1/checkout/guest", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  handleVnpayReturn: (queryParams: Record<string, string>): Promise<{
    msg: string
    orderId: string
    status: string
    paymentStatus: string
  }> =>
    fetchApi<{
      msg: string
      orderId: string
      status: string
      paymentStatus: string
    }>(`/api/v1/checkout/vnpay-return?${new URLSearchParams(queryParams).toString()}`),
}

export const reviewsApi = {
  create: (data: {
    product: string
    rating: number
    title: string
    comment: string
  }): Promise<{ review: Review }> =>
    fetchApi<{ review: Review }>("/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (): Promise<ReviewsResponse> => fetchApi<ReviewsResponse>("/api/v1/reviews"),

  getById: (id: string): Promise<{ review: Review }> =>
    fetchApi<{ review: Review }>(`/api/v1/reviews/${id}`),

  update: (id: string, data: { rating?: number; title?: string; comment?: string }): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/reviews/${id}`, {
      method: "DELETE",
    }),
}

export const discountsApi = {
  getAll: (): Promise<{ total_discounts: number; discounts: Discount[] }> =>
    fetchApi<{ total_discounts: number; discounts: Discount[] }>("/api/v1/discounts"),

  getById: (id: string): Promise<{ discount: Discount }> =>
    fetchApi<{ discount: Discount }>(`/api/v1/discounts/${id}`),


  create: (data: {
    code: string
    discountType: "percent" | "fixed"
    discountValue: number
    minOrder?: number
    maxDiscount?: number
    usageLimit?: number
    startDate?: string
    endDate?: string
    isActive?: boolean
  }): Promise<{ discount: Discount }> =>
    fetchApi<{ discount: Discount }>("/api/v1/discounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    code?: string
    discountType?: "percent" | "fixed"
    discountValue?: number
    minOrder?: number
    maxDiscount?: number
    usageLimit?: number
    startDate?: string
    endDate?: string
    isActive?: boolean
  }): Promise<{ discount: Discount }> =>
    fetchApi<{ discount: Discount }>(`/api/v1/discounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>(`/api/v1/discounts/${id}`, {
      method: "DELETE",
    }),
}

export const contactApi = {
  sendMessage: (data: {
    name: string
    email: string
    phone?: string
    subject?: string
    message: string
  }): Promise<{ msg: string }> =>
    fetchApi<{ msg: string }>("/api/v1/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

