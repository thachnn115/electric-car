"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { formatCurrency, getProductImageUrl } from "@/lib/utils"
import { hasDiscount, calculateDiscountPercent } from "@/lib/product-helpers"

interface ProductCardProps {
  readonly product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const productHasDiscount = hasDiscount(product)
  const discountPercent = productHasDiscount && product.originalPrice
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/products/${product._id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={getProductImageUrl(product.images[0] || "")}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {productHasDiscount && discountPercent > 0 && (
            <Badge variant="destructive" className="absolute top-3 left-3 shadow-md">
              -{discountPercent}%
            </Badge>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="secondary" className="absolute top-3 right-3 shadow-md">
              Còn {product.stock} xe máy điện
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="outline" className="absolute top-3 right-3 bg-background/90 shadow-md">
              Hết hàng
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4 lg:p-5 space-y-3 lg:space-y-4">
        <div className="space-y-2">
          <Link href={`/products/${product._id}`}>
            <h3 className="font-semibold text-lg lg:text-xl leading-tight hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm lg:text-base text-muted-foreground line-clamp-2 min-h-[2.5rem]">{product.shortDescription}</p>
        </div>

        <div className="flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={`star-${i}`}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {product.rating > 0 ? product.rating.toFixed(1) : "0.0"} ({product.reviews})
            </span>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((color, index) => (
              <div
                key={`${color.name}-${index}`}
                className="h-5 w-5 rounded-full border-2 border-border shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-muted-foreground font-medium">+{product.colors.length - 4}</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between pt-3 border-t border-border/50">
          <div className="space-y-0.5">
            <p className="text-xl lg:text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
            {productHasDiscount && product.originalPrice && (
              <p className="text-sm lg:text-base text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="outline"
            className="shrink-0 bg-transparent hover:bg-primary hover:text-primary-foreground transition-colors"
            disabled={product.stock === 0}
            asChild
          >
            <Link href={`/products/${product._id}`}>
              <ShoppingCart className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
