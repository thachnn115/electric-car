"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { discountsApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Discount } from "@/lib/types"
import { getErrorMessage } from "@/lib/error-handler"

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const { toast } = useToast()

  const fetchDiscounts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await discountsApi.getAll()
      setDiscounts(response.discounts)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchDiscounts()
  }, [fetchDiscounts])

  const filteredDiscounts = discounts.filter((discount) =>
    discount.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const openAddDialog = () => {
    setSelectedDiscount(null)
    setFormData({
      code: "",
      discountType: "percent",
      discountValue: "",
      minOrder: "",
      maxDiscount: "",
      usageLimit: "",
      startDate: "",
      endDate: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (discount: Discount) => {
    setSelectedDiscount(discount)
    setFormData({
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue.toString(),
      minOrder: discount.minOrder?.toString() || "",
      maxDiscount: discount.maxDiscount?.toString() || "",
      usageLimit: discount.usageLimit?.toString() || "",
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().split("T")[0] : "",
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().split("T")[0] : "",
      isActive: discount.isActive,
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (discount: Discount) => {
    setSelectedDiscount(discount)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.discountValue) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      const data = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrder: formData.minOrder ? Number(formData.minOrder) : undefined,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: formData.isActive,
      }

      if (selectedDiscount) {
        await discountsApi.update(selectedDiscount._id, data)
        toast({ title: "Cập nhật mã giảm giá thành công" })
      } else {
        await discountsApi.create(data)
        toast({ title: "Thêm mã giảm giá thành công" })
      }
      setIsDialogOpen(false)
      void fetchDiscounts()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (selectedDiscount) {
      try {
        await discountsApi.delete(selectedDiscount._id)
        toast({ title: "Xóa mã giảm giá thành công" })
        setIsDeleteDialogOpen(false)
        void fetchDiscounts()
      } catch (error) {
        toast({
          title: "Lỗi",
          description: getErrorMessage(error),
          variant: "destructive",
        })
      }
    }
  }

  const formatDiscountValue = (discount: Discount): string => {
    if (discount.discountType === "percent") {
      return `${discount.discountValue}%`
    }
    return formatCurrency(discount.discountValue)
  }

  const isExpired = (discount: Discount): boolean => {
    if (!discount.endDate) return false
    return new Date(discount.endDate) < new Date()
  }

  return (
    <>
      <AdminHeader title="Quản lý mã giảm giá" description={`${discounts.length} mã giảm giá`} />

      <main className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm mã giảm giá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm mã giảm giá
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Đơn tối thiểu</TableHead>
                    <TableHead>Giới hạn sử dụng</TableHead>
                    <TableHead>Ngày hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.map((discount) => (
                    <TableRow key={discount._id}>
                      <TableCell className="font-medium font-mono">{discount.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {discount.discountType === "percent" ? "Phần trăm" : "Số tiền"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatDiscountValue(discount)}</TableCell>
                      <TableCell>{discount.minOrder ? formatCurrency(discount.minOrder) : "-"}</TableCell>
                      <TableCell>
                        {discount.usageLimit
                          ? `${discount.usedCount || 0}/${discount.usageLimit}`
                          : "Không giới hạn"}
                      </TableCell>
                      <TableCell>
                        {discount.endDate ? new Date(discount.endDate).toLocaleDateString("vi-VN") : "Không hết hạn"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            !discount.isActive
                              ? "destructive"
                              : isExpired(discount)
                                ? "secondary"
                                : "default"
                              }
                        >
                          {!discount.isActive
                            ? "Vô hiệu"
                            : isExpired(discount)
                              ? "Hết hạn"
                              : "Hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(discount)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(discount)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredDiscounts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Không tìm thấy mã giảm giá nào</div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDiscount ? "Sửa mã giảm giá" : "Thêm mã giảm giá mới"}</DialogTitle>
            <DialogDescription>
              {selectedDiscount ? "Chỉnh sửa thông tin mã giảm giá" : "Điền thông tin để thêm mã giảm giá mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Mã giảm giá *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="VD: SALE10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountType">Loại giảm giá *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, discountType: value as "percent" | "fixed" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discountValue">Giá trị giảm *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
                  placeholder={formData.discountType === "percent" ? "VD: 10" : "VD: 100000"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minOrder">Đơn tối thiểu</Label>
                <Input
                  id="minOrder"
                  type="number"
                  value={formData.minOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minOrder: e.target.value }))}
                  placeholder="VD: 1000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxDiscount">Giảm tối đa</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))}
                  placeholder="VD: 500000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usageLimit">Giới hạn sử dụng</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="VD: 100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4"
                />
                Kích hoạt mã giảm giá
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>{selectedDiscount ? "Cập nhật" : "Thêm mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa mã giảm giá "{selectedDiscount?.code}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  )
}
