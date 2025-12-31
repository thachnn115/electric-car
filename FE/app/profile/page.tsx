"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, Save, Lock, Upload, User as UserIcon, X } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { usersApi, productsApi } from "@/lib/api"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/error-handler"
import { getProductImageUrl } from "@/lib/utils"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
    gender: undefined as "male" | "female" | "other" | undefined,
    dateOfBirth: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        gender: user.gender && user.gender !== "" ? (user.gender as "male" | "female" | "other") : undefined,
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
      })
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB")
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview("")
    setProfileData((prev) => ({ ...prev, avatar: "" }))
  }

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!profileData.name?.trim() || !profileData.email?.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên và Email)")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profileData.email.trim())) {
      toast.error("Email không hợp lệ")
      return
    }

    try {
      setIsSaving(true)
      
      // Upload avatar if new file is selected
      let avatarUrl = profileData.avatar
      if (avatarFile) {
        try {
          const uploadResponse = await productsApi.uploadImage(avatarFile)
          avatarUrl = uploadResponse.image
        } catch (error) {
          toast.error("Không thể upload ảnh đại diện. Vui lòng thử lại.")
          setIsSaving(false)
          return
        }
      }

      // Prepare update data - send all fields to allow clearing optional fields
      const updateData: {
        name: string
        email: string
        phone: string
        address: string
        avatar: string
        gender: string
        dateOfBirth?: string
      } = {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim() || "",
        address: profileData.address.trim() || "",
        avatar: avatarUrl || "",
        gender: profileData.gender || "",
      }
      
      // dateOfBirth: send empty string to clear, or the date value
      updateData.dateOfBirth = profileData.dateOfBirth || ""

      const response = await usersApi.updateUser(updateData)
      
      // Update auth context with new user data
      await refreshUser()
      
      // Update local form state with response data
      if (response.user) {
        setProfileData({
          name: response.user.name || "",
          email: response.user.email || "",
          phone: response.user.phone || "",
          address: response.user.address || "",
          avatar: response.user.avatar || "",
          gender: response.user.gender && response.user.gender !== "" 
            ? (response.user.gender as "male" | "female" | "other") 
            : undefined,
          dateOfBirth: response.user.dateOfBirth
            ? new Date(response.user.dateOfBirth).toISOString().split("T")[0]
            : "",
        })
        if (response.user.avatar) {
          setAvatarPreview(response.user.avatar)
        } else {
          setAvatarPreview("")
        }
        setAvatarFile(null)
      }
      
      toast.success("Cập nhật thông tin thành công")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    try {
      setIsChangingPassword(true)
      await usersApi.updatePassword(passwordData.oldPassword, passwordData.newPassword)
      toast.success("Đổi mật khẩu thành công")
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Tài khoản của tôi</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar Upload */}
                  <div className="grid gap-2">
                    <Label>Ảnh đại diện</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview.startsWith("http") ? avatarPreview : getProductImageUrl(avatarPreview)}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <UserIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" type="button" className="gap-2" asChild>
                            <span>
                              <Upload className="h-4 w-4" />
                              Tải ảnh
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        {avatarPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Xóa
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Kích thước tối đa: 5MB. Định dạng: JPG, PNG, WEBP</p>
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Nhập email"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="gender">Giới tính</Label>
                    <Select
                      value={profileData.gender || "none"}
                      onValueChange={(value: "none" | "male" | "female" | "other") =>
                        setProfileData((prev) => ({ ...prev, gender: value === "none" ? undefined : value }))
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không xác định</SelectItem>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <Separator />

                  <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Đổi mật khẩu</CardTitle>
                  <CardDescription>Cập nhật mật khẩu của bạn để bảo mật tài khoản</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="oldPassword">Mật khẩu hiện tại *</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      minLength={6}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Nhập lại mật khẩu mới"
                      minLength={6}
                    />
                  </div>

                  <Separator />

                  <Button onClick={handleChangePassword} disabled={isChangingPassword} className="gap-2">
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang đổi...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Đổi mật khẩu
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  )
}
