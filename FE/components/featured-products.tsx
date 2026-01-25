"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { productsApi } from "@/lib/api"
import { logger } from "@/lib/logger"
import type { Product } from "@/lib/types"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const response = await productsApi.getAll()
        setProducts(response.product.slice(0, 4))
      } catch (error) {
        logger.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">Đang tải...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Sản phẩm nổi bật</h2>
            <p className="text-muted-foreground">Khám phá những mẫu xe máy điện được yêu thích nhất</p>
          </div>
          <Link href="/products" className="hidden sm:block">
            <Button variant="ghost" className="gap-2">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/products">
                <Button variant="outline" className="gap-2 bg-transparent">
                  Xem tất cả sản phẩm
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không có sản phẩm nào</p>
          </div>
        )}
      </div>
    </section>
  )
}
