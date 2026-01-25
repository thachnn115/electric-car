"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, CreditCard, Check } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { checkoutApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { getErrorMessage } from "@/lib/error-handler"
import { getProductName, getProductImage } from "@/lib/product-helpers"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, isLoading, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    note: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("VNPAY")
  const [discountCode, setDiscountCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    setIsSubmitting(true)

    try {
      if (isAuthenticated) {
        const response = await checkoutApi.createOrder({
          discountCode: discountCode || undefined,
          paymentMethod: paymentMethod === "COD" ? "COD" : "VNPAY",
          userPhone: formData.phone,
          shippingAddress: formData.address,
        })

        if (paymentMethod === "COD") {
          await clearCart()
          router.push("/checkout/success")
        } else {
          if (response.paymentUrl) {
            await clearCart()
            window.location.href = response.paymentUrl
          } else {
            throw new Error("Không nhận được URL thanh toán")
          }
        }
      } else {
        const orderItems = items.map((item) => {
          const productId = typeof item.product === "string" ? item.product : item.product._id
          return {
            productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color,
            image: item.image,
          }
        })

        const response = await checkoutApi.createGuestOrder({
          items: orderItems,
          discountCode: discountCode || undefined,
          paymentMethod: paymentMethod === "COD" ? "COD" : "VNPAY",
          userName: formData.name,
          userEmail: formData.email,
          userPhone: formData.phone,
          shippingAddress: formData.address,
        })

        if (paymentMethod === "COD") {
          await clearCart()
          router.push("/checkout/success")
        } else {
          if (response.paymentUrl) {
            await clearCart()
            window.location.href = response.paymentUrl
          } else {
            throw new Error("Không nhận được URL thanh toán")
          }
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
      setIsSubmitting(false)
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Không có sản phẩm để thanh toán</h1>
            <p className="text-muted-foreground">Vui lòng thêm sản phẩm vào giỏ hàng</p>
            <Link href="/products">
              <Button>Tiếp tục mua sắm</Button>
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
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/cart"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại giỏ hàng
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-8">Thanh toán</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin khách hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="0901234567"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ giao hàng *</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Ghi chú</Label>
                      <Textarea
                        id="note"
                        name="note"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Phương thức thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="VNPAY" id="vnpay" />
                        <Label htmlFor="vnpay" className="flex-1 flex items-center gap-3 cursor-pointer">
                          <div className="h-10 w-16 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                            VNPAY
                          </div>
                          <div>
                            <p className="font-medium">Thanh toán qua VNPAY</p>
                            <p className="text-sm text-muted-foreground">Quét mã QR hoặc thẻ ATM/Visa/Mastercard</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="COD" id="cod" />
                        <Label htmlFor="cod" className="flex-1 flex items-center gap-3 cursor-pointer">
                          <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Thanh toán khi nhận hàng</p>
                            <p className="text-sm text-muted-foreground">Thanh toán bằng tiền mặt khi nhận xe</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle>Đơn hàng của bạn</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3">
                      {items.map((item, index) => {
                        const productId = typeof item.product === "string" ? item.product : item.product._id
                        const productName = getProductName(item)
                        const productImage = getProductImage(item)
                        const itemKey = `${productId}-${item.color}-${index}`

                        return (
                          <div key={itemKey} className="flex gap-3">
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                              <Image src={productImage} alt={productName} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.color} x {item.quantity}
                              </p>
                              <p className="text-sm font-medium text-primary">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Discount Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mã giảm giá</label>
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      />
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tạm tính</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí vận chuyển</span>
                        <span className="text-green-600">Miễn phí</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Đang xử lý..."
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Đặt hàng
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Bằng việc đặt hàng, bạn đồng ý với{" "}
                      <Link href="#" className="underline">
                        điều khoản dịch vụ
                      </Link>{" "}
                      của chúng tôi
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
