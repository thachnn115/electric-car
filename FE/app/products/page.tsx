"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productsApi, categoriesApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { logger } from "@/lib/logger"
import type { Product, Category } from "@/lib/types"

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryParam ? [categoryParam] : [])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000000])
  const [sortBy, setSortBy] = useState("featured")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [productsResponse, categoriesResponse] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll(),
        ])
        setProducts(productsResponse.product)
        setCategories(categoriesResponse.categories)
      } catch (error) {
        logger.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (categoryParam) {
        try {
          setIsLoading(true)
          const response = await categoriesApi.getProductsByCategory(categoryParam)
          setProducts(response.products)
        } catch (error) {
          logger.error("Failed to fetch category products:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (categoryParam) {
      fetchCategoryProducts()
    }
  }, [categoryParam])

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) || product.shortDescription.toLowerCase().includes(query),
      )
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        const categoryId = typeof product.category === "string" ? product.category : product.category._id
        const categorySlug = typeof product.category === "object" ? product.category.slug : ""
        return selectedCategories.some(
          (slug) => slug === categorySlug || categories.find((c) => c.slug === slug)?._id === categoryId,
        )
      })
    }

    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "newest":
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        break
    }

    return filtered
  }, [products, searchQuery, selectedCategories, priceRange, sortBy, categories])

  const toggleCategory = (categorySlug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categorySlug) ? prev.filter((c) => c !== categorySlug) : [...prev, categorySlug],
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setPriceRange([0, 5000000000])
    setSortBy("featured")
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
        <div className="space-y-3">
          <h3 className="font-semibold">Danh mục</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category._id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.slug}
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={() => toggleCategory(category.slug)}
                />
                <Label htmlFor={category.slug} className="text-sm font-normal cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold">Khoảng giá</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => {
              if (Array.isArray(value) && value.length === 2) {
                setPriceRange([value[0], value[1]])
              }
            }}
            min={0}
            max={5000000000}
            step={100000000}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{formatCurrency(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
        Xóa bộ lọc
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Sản phẩm</h1>
            <p className="text-muted-foreground mt-1">Khám phá bộ sưu tập xe máy điện của chúng tôi</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <FilterContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search and Sort Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Tìm kiếm xe máy điện..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Mobile Filter */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2 bg-transparent">
                        <SlidersHorizontal className="h-4 w-4" />
                        Bộ lọc
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Bộ lọc</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Nổi bật</SelectItem>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                      <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                      <SelectItem value="rating">Đánh giá cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count */}
              <p className="text-sm text-muted-foreground mb-4">Hiển thị {filteredProducts.length} sản phẩm</p>

              {/* Products Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">Đang tải...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">Không tìm thấy sản phẩm phù hợp</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Xóa bộ lọc
                  </Button>
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
