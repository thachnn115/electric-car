"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2, ArrowRight, Package } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkoutApi } from "@/lib/api"
import { getErrorMessage } from "@/lib/error-handler"
import { toast } from "sonner"

type ReturnState = {
  loading: boolean
  success: boolean | null
  message?: string
  orderId?: string
  paymentStatus?: string
}

export default function VnpayReturnPage() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<ReturnState>({ loading: true, success: null })

  useEffect(() => {
    const checkPayment = async () => {
      const params: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        params[key] = value
      })

      if (Object.keys(params).length === 0) {
        setState({
          loading: false,
          success: false,
          message: "Khong tim thay tham so VNPay. Vui long thu lai.",
        })
        return
      }

      try {
        setState((prev) => ({ ...prev, loading: true }))
        const response = await checkoutApi.handleVnpayReturn(params)
        setState({
          loading: false,
          success: response.paymentStatus === "paid",
          message: response.msg,
          orderId: response.orderId,
          paymentStatus: response.paymentStatus,
        })
      } catch (error) {
        const msg = getErrorMessage(error)
        toast.error(msg)
        setState({
          loading: false,
          success: false,
          message: msg,
        })
      }
    }

    checkPayment()
  }, [searchParams])

  const isSuccess = state.success === null ? false : state.success

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="flex justify-center">
                {state.loading ? (
                  <div className="h-20 w-20 rounded-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : (
                  <div
                    className={`h-20 w-20 rounded-full flex items-center justify-center ${
                      isSuccess ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  {state.loading
                    ? "Đang xác nhận thanh toán..."
                    : isSuccess
                      ? "Thanh toán thành công"
                      : "Thanh toán thất bại"}
                </h1>
                <p className="text-muted-foreground">
                  {state.loading
                    ? "Vui lòng đợi trong giây lát"
                    : state.message || (isSuccess ? "Đã xác nhận thanh toán VNPAY" : "Có lỗi xảy ra! Vui lòng thử lại.")}
                </p>
              </div>

              {!state.loading && state.orderId && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Mã đơn hàng: #{state.orderId.slice(-8).toUpperCase()}</span>
                  </div>
                  {state.paymentStatus && (
                    <p className="text-sm text-muted-foreground">Trạng thái thành toán: {state.paymentStatus}</p>
                  )}
                </div>
              )}

              {!state.loading && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {isSuccess && (
                    <Link href="/orders" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 bg-transparent">
                        <Package className="h-4 w-4" />
                        Xem đơn hàng
                      </Button>
                    </Link>
                  )}
                  <Link href="/products" className="flex-1">
                    <Button className="w-full gap-2">
                      Quay về trang chủ
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
