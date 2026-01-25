"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { categoriesApi, productsApi } from "@/lib/api"
import { getProductImageUrl } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import type { Category, Product } from "@/lib/types"
import { toast } from "sonner"
import { Package, ArrowRight, Loader2 } from "lucide-react"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await categoriesApi.getAll()
      setCategories(response.categories || [])
      if (response.categories && response.categories.length > 0) {
        setSelectedCategory(response.categories[0]._id)
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || "Lỗi khi tải danh mục")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchProductsByCategory = useCallback(
    async (categoryId: string) => {
      try {
        setIsLoadingProducts(true)
        // Try to find category by id to get slug
        const category = categories.find((cat) => cat._id === categoryId)
        if (category) {
          // Use the public API endpoint for getting products by category
          const response = await categoriesApi.getProductsByCategory(category.slug || categoryId)
          setProducts(response.products || [])
        } else {
          // Fallback: use products API with category filter
          const response = await productsApi.getAll({ category: categoryId })
          setProducts(response.products || [])
        }
      } catch (error) {
        toast.error(getErrorMessage(error) || "Lỗi khi tải sản phẩm")
      } finally {
        setIsLoadingProducts(false)
      }
    },
    [categories]
  )

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory)
    }
  }, [selectedCategory, fetchProductsByCategory])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Đang tải danh mục...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const selectedCategoryData = categories.find((cat) => cat._id === selectedCategory)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Danh mục sản phẩm</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Khám phá bộ sưu tập xe máy điện đa dạng của chúng tôi
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Danh mục</h2>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category._id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          selectedCategory === category._id
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {selectedCategoryData && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedCategoryData.name}</h2>
                  {selectedCategoryData.description && (
                    <p className="text-muted-foreground">{selectedCategoryData.description}</p>
                  )}
                </div>
              )}

              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link key={product._id} href={`/products/${product._id}`}>
                      <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <Image
                            src={getProductImageUrl(product.images[0] || "")}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.originalPrice && product.originalPrice > product.price && (
                            <Badge
                              variant="destructive"
                              className="absolute top-3 left-3"
                            >
                              Giảm{" "}
                              {Math.round(
                                ((product.originalPrice - product.price) / product.originalPrice) *
                                  100
                              )}
                              %
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {product.shortDescription}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-primary">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.price)}
                              </p>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <p className="text-sm text-muted-foreground line-through">
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(product.originalPrice)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button className="w-full mt-4" variant="outline">
                            Xem chi tiết
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Chưa có sản phẩm</h3>
                  <p className="text-muted-foreground mb-4">
                    Danh mục này hiện chưa có sản phẩm nào
                  </p>
                  <Link href="/products">
                    <Button variant="outline">Xem tất cả sản phẩm</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

