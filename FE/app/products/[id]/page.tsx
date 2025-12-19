"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Star, Minus, Plus, ShoppingCart, Check, Truck, Shield, RotateCcw } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { productsApi } from "@/lib/api"
import { formatCurrency, getProductImageUrl } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import { hasDiscount, calculateDiscountPercent } from "@/lib/product-helpers"
import type { Product } from "@/lib/types"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface ProductPageProps {
  readonly params: Promise<{ id: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; image: string } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const response = await productsApi.getById(resolvedParams.id)
        setProduct(response.product)
        if (response.product.colors.length > 0) {
          setSelectedColor(response.product.colors[0])
        }
      } catch {
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [resolvedParams.id])

  if (isLoading) {
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

  if (!product || !selectedColor) {
    notFound()
  }

  const productHasDiscount = hasDiscount(product)
  const discountPercent = productHasDiscount && product.originalPrice
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      })
      return
    }

    try {
      await addItem(product, quantity, selectedColor.name)
      toast({
        title: "Đã thêm vào giỏ hàng",
        description: `${quantity}x ${product.name} (${selectedColor.name})`,
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/products"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại sản phẩm
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={getProductImageUrl(product.images[selectedImage] || "")}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {productHasDiscount && discountPercent > 0 && (
                  <Badge variant="destructive" className="absolute top-4 left-4 text-sm">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={`image-${index}-${image}`}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[4/3] w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <Image
                      src={getProductImageUrl(image || "")}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={`star-${i}`}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating > 0 ? product.rating.toFixed(1) : "0.0"} ({product.reviews} đánh giá)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</span>
                  {productHasDiscount && product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.stock > 0 ? (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Còn {product.stock} xe trong kho
                  </p>
                ) : (
                  <p className="text-sm text-destructive">Hết hàng</p>
                )}
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Màu sắc</span>
                  <span className="text-sm text-muted-foreground">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColor.name === color.name
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor.name === color.name && (
                        <Check
                          className={`absolute inset-0 m-auto h-5 w-5 ${
                            color.hex === "#FFFFFF" || color.hex === "#F5F5F5" || color.hex === "#F8F8F8"
                              ? "text-foreground"
                              : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <span className="font-medium">Số lượng</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-r-none"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-l-none"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-4">
                <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart} disabled={product.stock === 0}>
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ hàng
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Giao hàng toàn quốc</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Bảo hành 5 năm</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">Đổi trả 30 ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Mô tả
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Thông số kỹ thuật
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-6">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </TabsContent>
              <TabsContent value="specs" className="pt-6">
                {product.specs.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {product.specs.map((spec) => (
                      <div key={`${spec.label}-${spec.value}`} className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">{spec.label}</span>
                        <span className="font-medium">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chưa có thông số kỹ thuật</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
