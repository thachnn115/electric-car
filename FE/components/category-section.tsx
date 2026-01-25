"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { categoriesApi } from "@/lib/api"
import { logger } from "@/lib/logger"
import type { Category } from "@/lib/types"

export function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const response = await categoriesApi.getAll()
        setCategories(response.categories)
      } catch (error) {
        logger.error("Failed to fetch categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">Đang tải...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Danh mục sản phẩm</h2>
          <p className="text-muted-foreground">Tìm kiếm xe máy điện phù hợp với nhu cầu của bạn</p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category._id} href={`/products?category=${category.slug}`}>
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl font-bold text-primary/20 group-hover:text-primary/30 transition-colors">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:translate-y-[-2px] transition-transform">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-white/90 line-clamp-2">{category.description}</p>
                      )}
                      {!category.description && (
                        <p className="text-sm text-white/80">Khám phá sản phẩm</p>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-6 w-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <CardContent className="p-4 bg-card">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Xem tất cả</span>
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không có danh mục nào</p>
          </div>
        )}
      </div>
    </section>
  )
}
