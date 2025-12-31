// Mock data for electric vehicles
export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  shortDescription: string
  images: string[]
  colors: { name: string; hex: string }[]
  category: string
  specs: { label: string; value: string }[]
  stock: number
  rating: number
  reviews: number
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  productCount: number
}

export interface User {
  id: string
  email: string
  name: string
  phone: string
  address: string
  role: "admin" | "user"
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  shippingAddress: string
  items: { productId: string; productName: string; quantity: number; price: number; color: string }[]
  total: number
  discount: number
  finalTotal: number
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled"
  paymentMethod: string
  paymentStatus: "pending" | "paid" | "failed"
  createdAt: string
}

export interface DiscountCode {
  id: string
  code: string
  discountType: "percent" | "fixed"
  discountValue: number
  minOrder: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  isActive: boolean
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Xe điện thể thao",
    slug: "xe-dien-the-thao",
    image: "/electric-sports-car-sleek-design.jpg",
    productCount: 8,
  },
  {
    id: "2",
    name: "Xe điện thành phố",
    slug: "xe-dien-thanh-pho",
    image: "/compact-electric-city-car.jpg",
    productCount: 12,
  },
  {
    id: "3",
    name: "Xe điện gia đình",
    slug: "xe-dien-gia-dinh",
    image: "/electric-family-suv.jpg",
    productCount: 6,
  },
  {
    id: "4",
    name: "Xe điện cao cấp",
    slug: "xe-dien-cao-cap",
    image: "/luxury-electric-sedan-premium.jpg",
    productCount: 4,
  },
]

export const products: Product[] = [
  {
    id: "1",
    name: "VinFast VF e34",
    price: 690000000,
    originalPrice: 750000000,
    description:
      "VinFast VF e34 là mẫu SUV điện cỡ C đầu tiên của VinFast, được thiết kế hiện đại với nhiều tính năng an toàn tiên tiến. Xe được trang bị động cơ điện mạnh mẽ, pin lithium-ion cho phép di chuyển lên đến 285km sau mỗi lần sạc đầy.",
    shortDescription: "SUV điện cỡ C với thiết kế hiện đại và tầm hoạt động 285km",
    images: ["/vinfast-vf-e34-electric-suv-white.jpg", "/vinfast-vf-e34-interior-modern.jpg", "/vinfast-vf-e34-side-view.jpg"],
    colors: [
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Đen", hex: "#1a1a1a" },
      { name: "Xanh dương", hex: "#1e40af" },
      { name: "Đỏ", hex: "#dc2626" },
    ],
    category: "xe-dien-gia-dinh",
    specs: [
      { label: "Động cơ", value: "110 kW" },
      { label: "Pin", value: "42 kWh" },
      { label: "Tầm hoạt động", value: "285 km" },
      { label: "Tốc độ tối đa", value: "170 km/h" },
      { label: "Thời gian sạc", value: "6-8 giờ" },
    ],
    stock: 15,
    rating: 4.5,
    reviews: 128,
  },
  {
    id: "2",
    name: "VinFast VF 8",
    price: 1090000000,
    originalPrice: 1200000000,
    description:
      "VinFast VF 8 là mẫu SUV điện cỡ D cao cấp với thiết kế sang trọng và công nghệ tiên tiến. Xe được trang bị hệ thống lái tự động cấp độ 2+, màn hình giải trí lớn và nhiều tính năng an toàn hàng đầu.",
    shortDescription: "SUV điện cỡ D cao cấp với công nghệ tự lái tiên tiến",
    images: ["/vinfast-vf8-electric-suv-premium-blue.jpg", "/vinfast-vf8-interior-luxury.jpg", "/vinfast-vf8-rear-view.jpg"],
    colors: [
      { name: "Xanh Navy", hex: "#1e3a5f" },
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Bạc", hex: "#C0C0C0" },
      { name: "Đen", hex: "#1a1a1a" },
    ],
    category: "xe-dien-cao-cap",
    specs: [
      { label: "Động cơ", value: "300 kW" },
      { label: "Pin", value: "87.7 kWh" },
      { label: "Tầm hoạt động", value: "471 km" },
      { label: "Tốc độ tối đa", value: "200 km/h" },
      { label: "0-100 km/h", value: "5.5 giây" },
    ],
    stock: 8,
    rating: 4.8,
    reviews: 89,
  },
  {
    id: "3",
    name: "Tesla Model 3",
    price: 1350000000,
    description:
      "Tesla Model 3 là mẫu sedan điện phổ biến nhất thế giới với thiết kế tối giản và hiệu suất vượt trội. Xe được trang bị hệ thống Autopilot tiên tiến và có tầm hoạt động lên đến 491km.",
    shortDescription: "Sedan điện phổ biến nhất với hệ thống Autopilot tiên tiến",
    images: ["/tesla-model-3-white-sedan-electric.jpg", "/tesla-model-3-minimalist-interior.jpg", "/tesla-model-3-charging-station.jpg"],
    colors: [
      { name: "Trắng Pearl", hex: "#F5F5F5" },
      { name: "Đen", hex: "#1a1a1a" },
      { name: "Xanh Midnight", hex: "#1a365d" },
      { name: "Đỏ", hex: "#b91c1c" },
    ],
    category: "xe-dien-the-thao",
    specs: [
      { label: "Động cơ", value: "Dual Motor AWD" },
      { label: "Pin", value: "82 kWh" },
      { label: "Tầm hoạt động", value: "491 km" },
      { label: "Tốc độ tối đa", value: "261 km/h" },
      { label: "0-100 km/h", value: "3.3 giây" },
    ],
    stock: 5,
    rating: 4.9,
    reviews: 256,
  },
  {
    id: "4",
    name: "Hyundai Ioniq 5",
    price: 1150000000,
    originalPrice: 1250000000,
    description:
      "Hyundai Ioniq 5 là mẫu crossover điện với thiết kế retro-futuristic độc đáo. Xe sử dụng nền tảng E-GMP mới, hỗ trợ sạc nhanh 800V và có không gian nội thất rộng rãi như một phòng khách di động.",
    shortDescription: "Crossover điện với thiết kế retro-futuristic độc đáo",
    images: ["/hyundai-ioniq-5-retro-futuristic-gray.jpg", "/hyundai-ioniq-5-spacious-interior.jpg", "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg"],
    colors: [
      { name: "Xám Gravity", hex: "#6b7280" },
      { name: "Trắng Atlas", hex: "#F8F8F8" },
      { name: "Xanh Digital", hex: "#0ea5e9" },
      { name: "Xanh Mystic", hex: "#134e4a" },
    ],
    category: "xe-dien-thanh-pho",
    specs: [
      { label: "Động cơ", value: "225 kW" },
      { label: "Pin", value: "77.4 kWh" },
      { label: "Tầm hoạt động", value: "481 km" },
      { label: "Sạc nhanh", value: "800V" },
      { label: "0-100 km/h", value: "5.2 giây" },
    ],
    stock: 10,
    rating: 4.7,
    reviews: 167,
  },
  {
    id: "5",
    name: "BYD Atto 3",
    price: 730000000,
    description:
      "BYD Atto 3 là mẫu SUV điện cỡ B+ đến từ Trung Quốc với công nghệ pin Blade tiên tiến. Xe có thiết kế trẻ trung, nội thất hiện đại và giá cả cạnh tranh.",
    shortDescription: "SUV điện giá tốt với công nghệ pin Blade tiên tiến",
    images: [
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
    ],
    colors: [
      { name: "Xanh Forest", hex: "#166534" },
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Xám", hex: "#4b5563" },
      { name: "Cam", hex: "#ea580c" },
    ],
    category: "xe-dien-thanh-pho",
    specs: [
      { label: "Động cơ", value: "150 kW" },
      { label: "Pin", value: "60.48 kWh" },
      { label: "Tầm hoạt động", value: "420 km" },
      { label: "Tốc độ tối đa", value: "160 km/h" },
      { label: "0-100 km/h", value: "7.3 giây" },
    ],
    stock: 20,
    rating: 4.4,
    reviews: 95,
  },
  {
    id: "6",
    name: "Mercedes EQS",
    price: 4500000000,
    description:
      "Mercedes EQS là mẫu sedan điện hạng sang đầu bảng với nội thất Hyperscreen ấn tượng. Xe có tầm hoạt động lên đến 770km, thiết kế khí động học xuất sắc và công nghệ tiên tiến nhất của Mercedes.",
    shortDescription: "Sedan điện hạng sang đầu bảng với nội thất Hyperscreen",
    images: [
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
    ],
    colors: [
      { name: "Đen Obsidian", hex: "#0f0f0f" },
      { name: "Bạc High-tech", hex: "#D4D4D4" },
      { name: "Xanh Nautical", hex: "#1e3a5f" },
      { name: "Trắng Polar", hex: "#FAFAFA" },
    ],
    category: "xe-dien-cao-cap",
    specs: [
      { label: "Động cơ", value: "385 kW" },
      { label: "Pin", value: "107.8 kWh" },
      { label: "Tầm hoạt động", value: "770 km" },
      { label: "Tốc độ tối đa", value: "210 km/h" },
      { label: "0-100 km/h", value: "4.3 giây" },
    ],
    stock: 3,
    rating: 4.9,
    reviews: 42,
  },
  {
    id: "7",
    name: "Porsche Taycan",
    price: 4200000000,
    description:
      "Porsche Taycan là mẫu xe thể thao điện đầu tiên của Porsche với hiệu suất vượt trội và khả năng xử lý đặc trưng của thương hiệu. Xe có hệ thống sạc 800V và có thể tăng tốc từ 0-100 km/h chỉ trong 2.8 giây.",
    shortDescription: "Xe thể thao điện với hiệu suất và khả năng xử lý đỉnh cao",
    images: [
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
    ],
    colors: [
      { name: "Đỏ Carmine", hex: "#9f1239" },
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Xanh Frozen", hex: "#0891b2" },
      { name: "Xám Volcano", hex: "#44403c" },
    ],
    category: "xe-dien-the-thao",
    specs: [
      { label: "Động cơ", value: "560 kW" },
      { label: "Pin", value: "93.4 kWh" },
      { label: "Tầm hoạt động", value: "510 km" },
      { label: "Tốc độ tối đa", value: "260 km/h" },
      { label: "0-100 km/h", value: "2.8 giây" },
    ],
    stock: 2,
    rating: 5.0,
    reviews: 38,
  },
  {
    id: "8",
    name: "Kia EV6",
    price: 1280000000,
    description:
      "Kia EV6 là mẫu crossover điện thể thao với thiết kế táo bạo và công nghệ tiên tiến. Xe sử dụng nền tảng E-GMP, hỗ trợ sạc nhanh 800V và có khả năng Vehicle-to-Load (V2L) độc đáo.",
    shortDescription: "Crossover điện thể thao với thiết kế táo bạo",
    images: [
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
      "https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg",
    ],
    colors: [
      { name: "Bạc", hex: "#A8A8A8" },
      { name: "Xanh Yacht", hex: "#134e4a" },
      { name: "Xám Runway", hex: "#525252" },
      { name: "Trắng Snow", hex: "#FAFAFA" },
    ],
    category: "xe-dien-the-thao",
    specs: [
      { label: "Động cơ", value: "239 kW" },
      { label: "Pin", value: "77.4 kWh" },
      { label: "Tầm hoạt động", value: "528 km" },
      { label: "Sạc nhanh", value: "800V" },
      { label: "0-100 km/h", value: "5.2 giây" },
    ],
    stock: 7,
    rating: 4.6,
    reviews: 112,
  },
]

export const discountCodes: DiscountCode[] = [
  {
    id: "1",
    code: "WELCOME10",
    discountType: "percent",
    discountValue: 10,
    minOrder: 500000000,
    maxDiscount: 50000000,
    usageLimit: 100,
    usedCount: 45,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
  },
  {
    id: "2",
    code: "SUMMER2024",
    discountType: "fixed",
    discountValue: 30000000,
    minOrder: 800000000,
    usageLimit: 50,
    usedCount: 12,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    isActive: true,
  },
  {
    id: "3",
    code: "VIP50",
    discountType: "percent",
    discountValue: 5,
    minOrder: 1000000000,
    maxDiscount: 100000000,
    usageLimit: 20,
    usedCount: 8,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
  },
]

export const users: User[] = [
  {
    id: "1",
    email: "admin@evcar.vn",
    name: "Admin",
    phone: "0901234567",
    address: "123 Nguyễn Huệ, Q1, TP.HCM",
    role: "admin",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    email: "nguyenvana@gmail.com",
    name: "Nguyễn Văn A",
    phone: "0912345678",
    address: "456 Lê Lợi, Q3, TP.HCM",
    role: "user",
    createdAt: "2024-02-15",
  },
  {
    id: "3",
    email: "tranthib@gmail.com",
    name: "Trần Thị B",
    phone: "0923456789",
    address: "789 Trần Hưng Đạo, Q5, TP.HCM",
    role: "user",
    createdAt: "2024-03-20",
  },
  {
    id: "4",
    email: "levanc@gmail.com",
    name: "Lê Văn C",
    phone: "0934567890",
    address: "101 Điện Biên Phủ, Bình Thạnh, TP.HCM",
    role: "user",
    createdAt: "2024-04-10",
  },
]

export const orders: Order[] = [
  {
    id: "ORD001",
    userId: "2",
    userName: "Nguyễn Văn A",
    userEmail: "nguyenvana@gmail.com",
    userPhone: "0912345678",
    shippingAddress: "456 Lê Lợi, Q3, TP.HCM",
    items: [{ productId: "1", productName: "VinFast VF e34", quantity: 1, price: 690000000, color: "Trắng" }],
    total: 690000000,
    discount: 50000000,
    finalTotal: 640000000,
    status: "delivered",
    paymentMethod: "VNPAY",
    paymentStatus: "paid",
    createdAt: "2024-05-15",
  },
  {
    id: "ORD002",
    userId: "3",
    userName: "Trần Thị B",
    userEmail: "tranthib@gmail.com",
    userPhone: "0923456789",
    shippingAddress: "789 Trần Hưng Đạo, Q5, TP.HCM",
    items: [{ productId: "2", productName: "VinFast VF 8", quantity: 1, price: 1090000000, color: "Xanh Navy" }],
    total: 1090000000,
    discount: 0,
    finalTotal: 1090000000,
    status: "shipping",
    paymentMethod: "VNPAY",
    paymentStatus: "paid",
    createdAt: "2024-06-20",
  },
  {
    id: "ORD003",
    userId: "4",
    userName: "Lê Văn C",
    userEmail: "levanc@gmail.com",
    userPhone: "0934567890",
    shippingAddress: "101 Điện Biên Phủ, Bình Thạnh, TP.HCM",
    items: [{ productId: "4", productName: "Hyundai Ioniq 5", quantity: 1, price: 1150000000, color: "Xám Gravity" }],
    total: 1150000000,
    discount: 30000000,
    finalTotal: 1120000000,
    status: "confirmed",
    paymentMethod: "VNPAY",
    paymentStatus: "paid",
    createdAt: "2024-07-10",
  },
  {
    id: "ORD004",
    userId: "2",
    userName: "Nguyễn Văn A",
    userEmail: "nguyenvana@gmail.com",
    userPhone: "0912345678",
    shippingAddress: "456 Lê Lợi, Q3, TP.HCM",
    items: [{ productId: "5", productName: "BYD Atto 3", quantity: 1, price: 730000000, color: "Xanh Forest" }],
    total: 730000000,
    discount: 0,
    finalTotal: 730000000,
    status: "pending",
    paymentMethod: "VNPAY",
    paymentStatus: "pending",
    createdAt: "2024-07-25",
  },
]

// Helper function to format currency in Vietnamese
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

// Helper function to get status label
export function getStatusLabel(status: Order["status"]): string {
  const labels: Record<Order["status"], string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
  }
  return labels[status]
}

// Helper function to get payment status label
export function getPaymentStatusLabel(status: Order["paymentStatus"]): string {
  const labels: Record<Order["paymentStatus"], string> = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    failed: "Thất bại",
  }
  return labels[status]
}
