"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Shield, Users, Award, Leaf, Heart, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const features = [
    {
      icon: Zap,
      title: "Công nghệ tiên tiến",
      description: "Sử dụng công nghệ pin lithium-ion hiện đại, mang lại hiệu suất cao và độ bền lâu dài",
    },
    {
      icon: Leaf,
      title: "Thân thiện môi trường",
      description: "Không phát thải khí CO2, góp phần bảo vệ môi trường và giảm thiểu ô nhiễm không khí",
    },
    {
      icon: Shield,
      title: "An toàn tuyệt đối",
      description: "Tuân thủ các tiêu chuẩn an toàn quốc tế, đảm bảo an toàn cho người sử dụng",
    },
    {
      icon: Award,
      title: "Chất lượng hàng đầu",
      description: "Sản phẩm được kiểm định chất lượng nghiêm ngặt, đảm bảo độ bền và hiệu suất tối ưu",
    },
    {
      icon: Users,
      title: "Dịch vụ chuyên nghiệp",
      description: "Đội ngũ tư vấn và hỗ trợ kỹ thuật chuyên nghiệp, luôn sẵn sàng phục vụ khách hàng",
    },
    {
      icon: Heart,
      title: "Cam kết khách hàng",
      description: "Đặt khách hàng làm trung tâm, cam kết mang lại trải nghiệm tốt nhất cho mọi người dùng",
    },
  ]

  const stats = [
    { label: "Khách hàng hài lòng", value: "10,000+" },
    { label: "Xe đã bán", value: "5,000+" },
    { label: "Năm kinh nghiệm", value: "10+" },
    { label: "Tỷ lệ hài lòng", value: "98%" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Về chúng tôi
              </h1>
              <p className="text-lg text-muted-foreground">
                Chúng tôi là đơn vị hàng đầu trong lĩnh vực xe máy điện tại Việt Nam, 
                cam kết mang đến những sản phẩm chất lượng cao và dịch vụ tốt nhất cho khách hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Sứ mệnh của chúng tôi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi tin rằng việc chuyển đổi sang phương tiện giao thông điện 
                  là bước đi quan trọng để xây dựng một tương lai bền vững. Sứ mệnh của 
                  chúng tôi là mang đến những chiếc xe máy điện chất lượng cao, giá cả hợp lý, 
                  giúp mọi người dễ dàng tiếp cận với công nghệ xanh.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi không chỉ bán xe, mà còn đồng hành cùng khách hàng trong hành trình 
                  chuyển đổi sang năng lượng sạch, góp phần bảo vệ môi trường cho thế hệ tương lai.
                </p>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-32 w-32 text-primary/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Tại sao chọn chúng tôi?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Chúng tôi tự hào mang đến những giá trị vượt trội cho khách hàng
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold">Giá trị cốt lõi</h2>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">🌱</div>
                    <h3 className="font-semibold mb-2">Bền vững</h3>
                    <p className="text-sm text-muted-foreground">
                      Cam kết với môi trường và tương lai xanh
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">💡</div>
                    <h3 className="font-semibold mb-2">Đổi mới</h3>
                    <p className="text-sm text-muted-foreground">
                      Không ngừng cải tiến và phát triển công nghệ
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">🤝</div>
                    <h3 className="font-semibold mb-2">Tin cậy</h3>
                    <p className="text-sm text-muted-foreground">
                      Xây dựng mối quan hệ lâu dài với khách hàng
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold">Sẵn sàng bắt đầu hành trình xanh?</h2>
              <p className="text-lg opacity-90">
                Khám phá bộ sưu tập xe máy điện của chúng tôi và tìm chiếc xe phù hợp với bạn
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/products">
                  <Button size="lg" variant="secondary">
                    Xem sản phẩm
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Liên hệ chúng tôi
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

