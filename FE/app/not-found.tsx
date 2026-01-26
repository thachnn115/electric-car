"use client"

import Link from "next/link"
import { Home, Package, MapPinOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />

                <div className="relative z-10 text-center max-w-2xl w-full">
                    {/* Animated Illustration Section */}
                    <div className="mb-8 relative flex justify-center">
                        <div className="relative group">
                            <div className="text-[10rem] sm:text-[12rem] font-black text-muted/20 select-none transition-all duration-700 group-hover:text-primary/10">404</div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="p-6 bg-background/80 backdrop-blur-sm rounded-2xl border shadow-2xl transform transition-transform duration-500 hover:scale-110">
                                    <MapPinOff className="h-16 w-16 sm:h-24 w-24 text-primary animate-bounce-slow" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-4 mb-10">
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Opps! Bạn đang lạc đường?
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto">
                            Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ mới.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
                        <Link href="/" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full gap-2 px-8 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                <Home className="h-5 w-5" />
                                Quay về trang chủ
                            </Button>
                        </Link>
                        <Link href="/orders" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full gap-2 px-8 h-12 text-base backdrop-blur-sm hover:bg-muted/50 transition-all">
                                <Package className="h-5 w-5" />
                                Đơn hàng của tôi
                            </Button>
                        </Link>
                    </div>

                    {/* Back Link */}
                    <button
                        onClick={() => globalThis.history.back()}
                        className="mt-12 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 group"
                    >
                        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                        Về trang trước đó
                    </button>
                </div>
            </main>
            <Footer />

            <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    )
}
