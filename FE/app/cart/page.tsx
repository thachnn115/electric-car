"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import {
  getProductId,
  getProductName,
  getProductStock,
  getProductImage,
} from "@/lib/product-helpers"
import { toast } from "sonner"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart, isLoading } = useCart()
  const { isAuthenticated } = useAuth()
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    amount: number
  } | null>(null)

  const applyDiscount = () => {
    setAppliedDiscount({ code: discountCode, amount: 0 })
    toast.info("Mã giảm giá sẽ được kiểm tra và áp dụng khi bạn tiến hành thanh toán")
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode("")
  }

  const finalTotal = total - (appliedDiscount?.amount || 0)

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Giỏ hàng trống</h1>
            <p className="text-muted-foreground">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <Link href="/products">
              <Button className="gap-2">
                Tiếp tục mua sắm
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Giỏ hàng</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => {
                const productId = getProductId(item)
                const productName = getProductName(item)
                const productStock = getProductStock(item)
                const productImage = getProductImage(item)
                const itemKey = `${productId}-${item.color}-${index}`

                const handleRemove = async () => {
                  try {
                    await removeItem(productId, item.color)
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  }
                }

                const handleDecreaseQuantity = async () => {
                  try {
                    await updateQuantity(productId, item.color, item.quantity - 1)
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  }
                }

                const handleIncreaseQuantity = async () => {
                  try {
                    await updateQuantity(productId, item.color, Math.min(productStock, item.quantity + 1))
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  }
                }

                return (
                  <Card key={itemKey} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image src={productImage} alt={productName} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/products/${productId}`}
                                className="font-semibold hover:text-primary transition-colors line-clamp-1"
                              >
                                {productName}
                              </Link>
                              <p className="text-sm text-muted-foreground">Màu: {item.color}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={handleRemove}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-end justify-between">
                            <div className="flex items-center border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={handleDecreaseQuantity}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={handleIncreaseQuantity}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-semibold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  className="bg-transparent"
                  onClick={async () => {
                    try {
                      await clearCart()
                      toast.success("Tất cả sản phẩm đã được xóa khỏi giỏ hàng")
                    } catch (error) {
                      toast.error(getErrorMessage(error))
                    }
                  }}
                >
                  Xóa giỏ hàng
                </Button>
                <Link href="/products">
                  <Button variant="ghost">Tiếp tục mua sắm</Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Discount Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mã giảm giá</label>
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">{appliedDiscount.code}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-green-600 hover:text-green-700"
                          onClick={removeDiscount}
                        >
                          Xóa
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập mã giảm giá"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                        />
                        <Button variant="outline" className="bg-transparent shrink-0" onClick={applyDiscount}>
                          Áp dụng
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(appliedDiscount.amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phí vận chuyển</span>
                      <span className="text-green-600">Miễn phí</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/checkout" className="w-full">
                    <Button size="lg" className="w-full gap-2">
                      Tiến hành thanh toán
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
