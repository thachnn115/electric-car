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
import { Card, CardContent } from "@/components/ui/card"
import { productsApi, reviewsApi } from "@/lib/api"
import { formatCurrency, getProductImageUrl } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import { hasDiscount, calculateDiscountPercent, getColorPrice, getColorOriginalPrice, hasColorDiscount } from "@/lib/product-helpers"
import type { Product, Review } from "@/lib/types"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ProductPageProps {
  readonly params: Promise<{ id: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState<Product["colors"][0] | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const response = await productsApi.getById(resolvedParams.id)
        setProduct(response.product)
        if (response.product.colors.length > 0) {
          const firstColor = response.product.colors[0]
          setSelectedColor(firstColor)
          setSelectedImageIndex(null) // null means showing color image
        } else {
          setSelectedImageIndex(0) // Show first gallery image if no colors
        }
      } catch {
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [resolvedParams.id])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?._id) return
      try {
        setIsLoadingReviews(true)
        const response = await productsApi.getReviews(product._id)
        setReviews(response.reviews || [])
      } catch (error) {
        // Silently fail - reviews are optional
        console.error("Failed to fetch reviews:", error)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [product?._id])

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error("Bạn cần đăng nhập để đánh giá sản phẩm")
      return
    }

    if (!product?._id) return

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung đánh giá")
      return
    }

    try {
      setIsSubmittingReview(true)
      await reviewsApi.create({
        product: product._id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      })
      toast.success("Đánh giá của bạn đã được gửi thành công!")
      setIsReviewDialogOpen(false)
      setReviewForm({ rating: 5, title: "", comment: "" })
      // Refresh reviews
      const response = await productsApi.getReviews(product._id)
      setReviews(response.reviews || [])
    } catch (error) {
      toast.error(getErrorMessage(error) || "Không thể gửi đánh giá")
    } finally {
      setIsSubmittingReview(false)
    }
  }

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

  if (!product) {
    notFound()
  }

  const currentColor = selectedColor
    ? product.colors.find((c) => c.name === selectedColor.name)
    : product.colors[0]
  const currentPrice = currentColor ? getColorPrice(currentColor, product.price) : product.price
  const currentOriginalPrice = currentColor ? getColorOriginalPrice(currentColor, product.originalPrice) : product.originalPrice
  const colorHasDiscount = currentColor ? hasColorDiscount(currentColor, product) : false
  const discountPercent = colorHasDiscount && currentOriginalPrice
    ? calculateDiscountPercent(currentOriginalPrice, currentPrice)
    : 0

  const handleAddToCart = async () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("Vui lòng chọn màu sắc")
      return
    }

    try {
      const colorName = selectedColor?.name || "Mặc định"
      await addItem(product, quantity, colorName)
      toast.success(`Đã thêm ${quantity}x ${product.name}${selectedColor ? ` (${selectedColor.name})` : ""} vào giỏ hàng`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const getCurrentImage = (): string => {
    if (selectedImageIndex !== null) {
      return product.images[selectedImageIndex] || ""
    }
    if (selectedColor?.image) {
      return selectedColor.image
    }
    return product.images[0] || ""
  }

  const handleColorSelect = (color: Product["colors"][0]) => {
    setSelectedColor(color)
    setSelectedImageIndex(null)
  }

  const handleGalleryImageSelect = (index: number) => {
    setSelectedImageIndex(index)
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

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4 lg:space-y-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-lg">
                <Image
                  src={getProductImageUrl(getCurrentImage())}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {colorHasDiscount && discountPercent > 0 && (
                  <Badge variant="destructive" className="absolute top-4 left-4 text-sm">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                {/* Color Images */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Ảnh theo màu</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {product.colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => handleColorSelect(color)}
                          className={`relative aspect-[4/3] w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedColor?.name === color.name && selectedImageIndex === null
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-primary/50"
                          }`}
                          title={color.name}
                        >
                          <Image
                            src={getProductImageUrl(color.image || "")}
                            alt={`${product.name} - ${color.name}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Gallery Images */}
                {product.images && product.images.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Ảnh sản phẩm</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {product.images.map((image, index) => (
                        <button
                          key={`image-${index}-${image}`}
                          onClick={() => handleGalleryImageSelect(index)}
                          className={`relative aspect-[4/3] w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index
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
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6 lg:space-y-8">
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
              <div className="space-y-2">
                <div className="flex items-baseline gap-3 transition-all duration-300">
                  <span className="text-3xl lg:text-4xl font-bold text-primary">{formatCurrency(currentPrice)}</span>
                  {colorHasDiscount && currentOriginalPrice && (
                    <span className="text-lg lg:text-xl text-muted-foreground line-through">
                      {formatCurrency(currentOriginalPrice)}
                    </span>
                  )}
                </div>
                {product.stock > 0 ? (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Còn {product.stock} xe máy điện trong kho
                  </p>
                ) : (
                  <p className="text-sm text-destructive">Hết hàng</p>
                )}
              </div>

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-base lg:text-lg">Màu sắc</span>
                    <span className="text-sm lg:text-base text-muted-foreground font-medium">{selectedColor?.name || product.colors[0]?.name || "Chưa chọn"}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 lg:gap-4">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name || (!selectedColor && product.colors[0]?.name === color.name)
                      return (
                        <button
                          key={color.name}
                          onClick={() => handleColorSelect(color)}
                          className={`relative h-12 w-12 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20 shadow-md"
                              : "border-border hover:border-primary/50"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {isSelected && (
                            <Check
                              className={`absolute inset-0 m-auto h-5 w-5 ${
                                color.hex === "#FFFFFF" || color.hex === "#F5F5F5" || color.hex === "#F8F8F8"
                                  ? "text-foreground"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3 lg:space-y-4">
                <span className="font-medium text-base lg:text-lg">Số lượng</span>
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
              <div className="flex gap-4 pt-2">
                <Button size="lg" className="flex-1 gap-2 h-12 lg:h-14 text-base lg:text-lg font-semibold" onClick={handleAddToCart} disabled={product.stock === 0}>
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ hàng
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6 pt-6 border-t">
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
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Đánh giá ({reviews.length})
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
              <TabsContent value="reviews" className="pt-6">
                <div className="space-y-6">
                  {/* Review Form */}
                  {isAuthenticated && (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Viết đánh giá</h3>
                          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline">Viết đánh giá</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Đánh giá sản phẩm</DialogTitle>
                                <DialogDescription>
                                  Chia sẻ trải nghiệm của bạn về sản phẩm này với cộng đồng
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Đánh giá sao</Label>
                                  <div className="flex items-center gap-2">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: i + 1 }))}
                                        className="focus:outline-none"
                                      >
                                        <Star
                                          className={`h-8 w-8 transition-colors ${
                                            i < reviewForm.rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-muted-foreground/30 hover:text-yellow-400/50"
                                          }`}
                                        />
                                      </button>
                                    ))}
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {reviewForm.rating}/5 sao
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="review-title">
                                    Tiêu đề <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="review-title"
                                    placeholder="Nhập tiêu đề đánh giá"
                                    value={reviewForm.title}
                                    onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                                    maxLength={100}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="review-comment">
                                    Nội dung đánh giá <span className="text-destructive">*</span>
                                  </Label>
                                  <Textarea
                                    id="review-comment"
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                                    rows={5}
                                    maxLength={500}
                                  />
                                  <p className="text-xs text-muted-foreground text-right">
                                    {reviewForm.comment.length}/500 ký tự
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                                  Hủy
                                </Button>
                                <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                                  {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Chia sẻ trải nghiệm của bạn để giúp người khác đưa ra quyết định tốt hơn
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  {isLoadingReviews ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Đang tải đánh giá...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => {
                        const userName = typeof review.user === "string" ? "Người dùng" : review.user?.name || "Người dùng"
                        return (
                          <div key={review._id} className="border-b pb-6 last:border-b-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{review.title}</h4>
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={`review-star-${i}`}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground/30"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">Bởi {userName}</p>
                              </div>
                              {review.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này</p>
                      {!isAuthenticated && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Đăng nhập để trở thành người đầu tiên đánh giá sản phẩm này
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
