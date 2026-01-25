import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Zap, Shield, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>Công nghệ xe máy điện tiên tiến</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-balance">
              Tương lai di chuyển
              <span className="text-primary block">bắt đầu từ hôm nay</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Khám phá bộ sưu tập xe máy điện cao cấp với công nghệ tiên tiến, thiết kế sang trọng và thân thiện với môi
              trường. Trải nghiệm cuộc sống xanh ngay hôm nay.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Khám phá ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Xem danh mục
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Sạc nhanh</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Bảo hành 5 năm</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Thân thiện MT</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://static-cms-prod.vinfastauto.com/hinh-anh-xe-vinfast-dep-thumb_1650707860.jpeg"
                alt="Electric Car Showroom"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-background rounded-xl shadow-lg p-4 border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">0 khí thải</p>
                  <p className="text-sm text-muted-foreground">Bảo vệ môi trường</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
