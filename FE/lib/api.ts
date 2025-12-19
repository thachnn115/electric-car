import type {
  Product,
  ProductsResponse,
  Category,
  CategoriesResponse,
  CategoryProductsResponse,
  Cart,
  CartResponse,
  Order,
  OrdersResponse,
  Review,
  ReviewsResponse,
  CheckoutResponse,
  User,
  Discount,
} from "./types"
import { API_BASE_URL } from "./constants"

interface ApiError {
  msg?: string
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

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
  getAll: (): Promise<ProductsResponse> => fetchApi<ProductsResponse>("/api/v1/products"),
  
  getById: (id: string): Promise<{ product: Product }> =>
    fetchApi<{ product: Product }>(`/api/v1/products/${id}`),
  
  getReviews: (id: string): Promise<ReviewsResponse> =>
    fetchApi<ReviewsResponse>(`/api/v1/products/${id}/reviews`),
}

export const categoriesApi = {
  getAll: (): Promise<CategoriesResponse> =>
    fetchApi<CategoriesResponse>("/api/v1/public/categories"),
  
  getProductsByCategory: (slug: string): Promise<CategoryProductsResponse> =>
    fetchApi<CategoryProductsResponse>(`/api/v1/public/categories/${slug}/products`),
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
}

export const ordersApi = {
  getAll: (): Promise<OrdersResponse> => fetchApi<OrdersResponse>("/api/v1/orders"),
  
  getMyOrders: (): Promise<OrdersResponse> =>
    fetchApi<OrdersResponse>("/api/v1/orders/showAllMyOrders"),
  
  getById: (id: string): Promise<{ order: Order }> =>
    fetchApi<{ order: Order }>(`/api/v1/orders/${id}`),
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
