"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { productsApi, categoriesApi } from "@/lib/api"
import { formatCurrency, getProductImageUrl } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Product, Category } from "@/lib/types"
import { getErrorMessage } from "@/lib/error-handler"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    shortDescription: "",
    description: "",
    category: "",
    stock: "",
  })
  const [galleryFiles, setGalleryFiles] = useState<Array<{ file: File; preview: string }>>([])
  const [colors, setColors] = useState<Array<{ name: string; hex: string; imageFile: File | null; preview?: string }>>([
    { name: "", hex: "#000000", imageFile: null },
  ])
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>([{ label: "", value: "" }])
  const { toast } = useToast()

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await productsApi.getAllAdmin()
      setProducts(response.products)
    } catch (error) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Lỗi</span>
          </div>
        ),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAllAdmin()
      setCategories(response.categories)
    } catch (error) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Lỗi</span>
          </div>
        ),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    void fetchProducts()
    void fetchCategories()
  }, [fetchProducts, fetchCategories])

  const handleSearch = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await productsApi.searchAdmin({
        q: searchQuery || undefined,
      })
      setProducts(response.products)
    } catch (error) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Lỗi</span>
          </div>
        ),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, toast])

  const filteredProducts = products.filter(
    (product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const openAddDialog = () => {
    setSelectedProduct(null)
    setFormData({
      name: "",
      price: "",
      originalPrice: "",
      shortDescription: "",
      description: "",
      category: "",
      stock: "",
    })
    // Cleanup preview URLs
    galleryFiles.forEach((item: { file: File; preview: string }) => {
      URL.revokeObjectURL(item.preview)
    })
    setGalleryFiles([])
    setColors([{ name: "", hex: "#000000", imageFile: null }])
    setSpecs([{ label: "", value: "" }])
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product): void => {
    setSelectedProduct(product)
    const categoryId = typeof product.category === "string" ? product.category : product.category._id
    setFormData({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      shortDescription: product.shortDescription,
      description: product.description,
      category: categoryId,
      stock: product.stock.toString(),
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const showErrorToast = (description: string) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Lỗi</span>
        </div>
      ),
      description,
      variant: "destructive",
    })
  }

  const validateBasicFields = (): boolean => {
    if (!formData.name?.trim()) {
      showErrorToast("Vui lòng nhập tên sản phẩm")
      return false
    }

    if (!formData.price || Number(formData.price) <= 0) {
      showErrorToast("Vui lòng nhập giá bán hợp lệ (lớn hơn 0)")
      return false
    }

    if (formData.originalPrice && Number(formData.originalPrice) <= 0) {
      showErrorToast("Giá gốc phải lớn hơn 0")
      return false
    }

    if (formData.originalPrice && Number(formData.originalPrice) <= Number(formData.price)) {
      showErrorToast("Giá gốc phải lớn hơn giá bán")
      return false
    }

    if (!formData.category) {
      showErrorToast("Vui lòng chọn danh mục")
      return false
    }

    if (!formData.shortDescription?.trim()) {
      showErrorToast("Vui lòng nhập mô tả ngắn")
      return false
    }

    if (!formData.description?.trim()) {
      showErrorToast("Vui lòng nhập mô tả chi tiết")
      return false
    }

    if (!formData.stock || Number(formData.stock) < 0) {
      showErrorToast("Vui lòng nhập số lượng tồn kho hợp lệ (>= 0)")
      return false
    }

    return true
  }

  const validateCreateFields = (): boolean => {
    if (galleryFiles.length === 0) {
      showErrorToast("Vui lòng thêm ít nhất một ảnh gallery")
      return false
    }

    const validColors = colors.filter((c: { name: string; hex: string; imageFile: File | null }) => c.name?.trim() && c.hex && c.imageFile)
    if (validColors.length === 0) {
      showErrorToast("Vui lòng thêm ít nhất một màu với tên và ảnh")
      return false
    }

    const invalidColor = validColors.find((c: { name: string; hex: string; imageFile: File | null }) => !/^#[0-9A-Fa-f]{6}$/.test(c.hex))
    if (invalidColor) {
      showErrorToast("Mã màu hex không hợp lệ (phải có định dạng #RRGGBB)")
      return false
    }

    return true
  }

  const createProductData = (): FormData => {
    const formDataToSend = new FormData()
    formDataToSend.append("name", formData.name)
    formDataToSend.append("price", formData.price)
    if (formData.originalPrice) formDataToSend.append("originalPrice", formData.originalPrice)
    formDataToSend.append("shortDescription", formData.shortDescription)
    formDataToSend.append("description", formData.description)
    formDataToSend.append("category", formData.category)
    formDataToSend.append("stock", formData.stock)

    galleryFiles.forEach((item: { file: File; preview: string }) => {
      formDataToSend.append("gallery", item.file)
    })

    const validColors = colors.filter((c: { name: string; hex: string; imageFile: File | null }) => c.name?.trim() && c.hex && c.imageFile)
    const colorsData = validColors.map((c: { name: string; hex: string; imageFile: File | null }) => ({ name: c.name, hex: c.hex }))
    formDataToSend.append("colors", JSON.stringify(colorsData))

    validColors.forEach((color: { name: string; hex: string; imageFile: File | null }) => {
      if (color.imageFile) {
        formDataToSend.append("colorImages", color.imageFile)
      }
    })

    const validSpecs = specs.filter((s: { label: string; value: string }) => s.label && s.value)
    if (validSpecs.length > 0) {
      formDataToSend.append("specs", JSON.stringify(validSpecs))
    }

    return formDataToSend
  }

  const handleSave = async () => {
    if (!validateBasicFields()) {
      return
    }

    if (selectedProduct === null) {
      if (!validateCreateFields()) {
        return
      }

      setIsSaving(true)
      try {
        const formDataToSend = createProductData()
        await productsApi.create(formDataToSend)
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Thành công</span>
            </div>
          ),
          description: "Thêm sản phẩm thành công",
        })
        setIsDialogOpen(false)
        void fetchProducts()
      } catch (error) {
        showErrorToast(getErrorMessage(error))
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsSaving(true)
      try {
        await productsApi.update(selectedProduct._id, {
          name: formData.name,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          shortDescription: formData.shortDescription,
          description: formData.description,
          category: formData.category,
          stock: Number(formData.stock),
        })
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Thành công</span>
            </div>
          ),
          description: "Cập nhật sản phẩm thành công",
        })
        setIsDialogOpen(false)
        void fetchProducts()
      } catch (error) {
        showErrorToast(getErrorMessage(error))
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleDelete = async () => {
    if (selectedProduct) {
      try {
        await productsApi.delete(selectedProduct._id)
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Thành công</span>
            </div>
          ),
          description: "Xóa sản phẩm thành công",
        })
        setIsDeleteDialogOpen(false)
        void fetchProducts()
      } catch (error) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Lỗi</span>
            </div>
          ),
          description: getErrorMessage(error),
          variant: "destructive",
        })
      }
    }
  }

  const getCategoryName = (category: Product["category"]): string => {
    if (typeof category === "string") {
      return categories.find((c: Category) => c._id === category)?.name || category
    }
    return category.name
  }

  const handleRemoveGalleryImage = (preview: string) => {
    URL.revokeObjectURL(preview)
    setGalleryFiles((prev: Array<{ file: File; preview: string }>) => 
      prev.filter((prevItem: { file: File; preview: string }) => prevItem.preview !== preview)
    )
  }

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newItems = files.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setGalleryFiles((prev: Array<{ file: File; preview: string }>) => [...prev, ...newItems])
  }

  const handleColorNameChange = (index: number, value: string) => {
    const newColors = colors.map((c: { name: string; hex: string; imageFile: File | null; preview?: string }, i: number) => 
      i === index ? { ...c, name: value } : c
    )
    setColors(newColors)
  }

  const handleColorHexChange = (index: number, value: string) => {
    const newColors = colors.map((c: { name: string; hex: string; imageFile: File | null; preview?: string }, i: number) => 
      i === index ? { ...c, hex: value } : c
    )
    setColors(newColors)
  }

  const handleColorImageChange = (index: number, file: File) => {
    const newColors = colors.map((c: { name: string; hex: string; imageFile: File | null; preview?: string }, i: number) => 
      i === index ? { ...c, imageFile: file, preview: URL.createObjectURL(file) } : c
    )
    setColors(newColors)
  }

  const handleRemoveColor = (index: number) => {
    const targetColor = colors[index]
    setColors((prev: Array<{ name: string; hex: string; imageFile: File | null; preview?: string }>) => 
      prev.filter((c: { name: string; hex: string; imageFile: File | null; preview?: string }) => 
        c.hex !== targetColor.hex || c.name !== targetColor.name
      )
    )
  }

  const handleSpecLabelChange = (index: number, value: string) => {
    const newSpecs = specs.map((s: { label: string; value: string }, i: number) => 
      i === index ? { ...s, label: value } : s
    )
    setSpecs(newSpecs)
  }

  const handleSpecValueChange = (index: number, value: string) => {
    const newSpecs = specs.map((s: { label: string; value: string }, i: number) => 
      i === index ? { ...s, value: value } : s
    )
    setSpecs(newSpecs)
  }

  const handleRemoveSpec = (index: number) => {
    const targetSpec = specs[index]
    setSpecs((prev: Array<{ label: string; value: string }>) => 
      prev.filter((s: { label: string; value: string }) => 
        s.label !== targetSpec.label || s.value !== targetSpec.value
      )
    )
  }

  return (
    <>
      <AdminHeader title="Quản lý sản phẩm" description={`${products.length} sản phẩm`} />

      <main className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  void handleSearch()
                }
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
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
                    <TableHead className="w-16">Ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-center">Kho</TableHead>
                    <TableHead className="text-center">Đánh giá</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={getProductImageUrl(product.images[0] || "")}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{product.shortDescription}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getCategoryName(product.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          {product.originalPrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(product.originalPrice)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          let variant: "secondary" | "outline" | "destructive" = "destructive"
                          if (product.stock > 5) {
                            variant = "secondary"
                          } else if (product.stock > 0) {
                            variant = "outline"
                          }
                          return (
                            <Badge variant={variant}>
                              {product.stock}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{product.rating > 0 ? product.rating.toFixed(1) : "0.0"}</span>
                          <span className="text-muted-foreground">({product.reviews})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/products/${product._id}`} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4 mr-2" />
                                Xem
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(product)}>
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

            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Không tìm thấy sản phẩm nào</div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? "Chỉnh sửa thông tin sản phẩm" : "Điền thông tin để thêm sản phẩm mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-4">Thông tin cơ bản</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: typeof formData) => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: VinFast VF 8"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Giá bán *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: typeof formData) => ({ ...prev, price: e.target.value }))}
                        placeholder="VD: 1000000000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="originalPrice">Giá gốc (tùy chọn)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: typeof formData) => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="VD: 1200000000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Danh mục *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: string) => setFormData((prev: typeof formData) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Số lượng tồn kho *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: typeof formData) => ({ ...prev, stock: e.target.value }))}
                        placeholder="VD: 10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="shortDescription">Mô tả ngắn *</Label>
                    <Input
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: typeof formData) => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Mô tả ngắn gọn về sản phẩm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Mô tả chi tiết *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev: typeof formData) => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả chi tiết về sản phẩm"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>

            {selectedProduct === null && (
              <>
                <Separator />
                
                {/* Hình ảnh */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Hình ảnh</h3>
                    <div className="grid gap-2">
                      <Label>Ảnh gallery *</Label>
                  <div className="flex flex-wrap gap-2">
                    {galleryFiles.map((item: { file: File; preview: string }, index: number) => (
                      <div key={`gallery-${item.file.name}-${index}`} className="relative w-32 h-32 rounded-lg overflow-hidden border group">
                        <Image
                          src={item.preview}
                          alt={`Gallery ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveGalleryImage(item.preview)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/60 px-1 py-0.5 rounded truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.file.name}
                        </div>
                      </div>
                    ))}
                    <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryFilesChange}
                      />
                    </label>
                  </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Màu sắc */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Màu sắc</h3>
                    <div className="grid gap-2">
                      <Label>Màu sắc *</Label>
                  <div className="space-y-3">
                    {colors.map((color: { name: string; hex: string; imageFile: File | null; preview?: string }, index: number) => (
                      <div key={`color-${color.hex}-${index}`} className="flex gap-2 items-end">
                        <div className="grid gap-2 flex-1">
                          <Input
                            placeholder="Tên màu"
                            value={color.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorNameChange(index, e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2 w-32">
                          <Input
                            type="color"
                            value={color.hex}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorHexChange(index, e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2 w-32">
                          <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted group relative overflow-hidden">
                            {color.imageFile ? (
                              <>
                                <div className="relative w-full h-full">
                                  <Image
                                    src={color.preview || URL.createObjectURL(color.imageFile)}
                                    alt={color.name || "Color"}
                                    fill
                                    className="object-cover rounded-lg"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                                <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/60 px-1 py-0.5 rounded truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                  {color.imageFile.name}
                                </div>
                              </>
                            ) : (
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleColorImageChange(index, file)
                                }
                              }}
                            />
                          </label>
                        </div>
                        {colors.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveColor(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setColors((prev: Array<{ name: string; hex: string; imageFile: File | null; preview?: string }>) => [...prev, { name: "", hex: "#000000", imageFile: null }])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm màu
                    </Button>
                  </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Thông số kỹ thuật */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Thông số kỹ thuật</h3>
                    <div className="grid gap-2">
                      <Label>Thông số kỹ thuật</Label>
                  <div className="space-y-3">
                    {specs.map((spec: { label: string; value: string }, index: number) => (
                      <div key={`spec-${spec.label}-${index}`} className="flex gap-2">
                        <Input
                          placeholder="Nhãn (VD: Công suất)"
                          value={spec.label}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpecLabelChange(index, e.target.value)}
                        />
                        <Input
                          placeholder="Giá trị (VD: 300kW)"
                          value={spec.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpecValueChange(index, e.target.value)}
                        />
                        {specs.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveSpec(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpecs((prev: Array<{ label: string; value: string }>) => [...prev, { label: "", value: "" }])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm thông số
                    </Button>
                  </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {(() => {
                if (isSaving) {
                  const actionText = selectedProduct ? "cập nhật" : "tạo"
                  return (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang {actionText}...
                    </>
                  )
                }
                return selectedProduct ? "Cập nhật" : "Thêm mới"
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"? Hành động này không thể hoàn tác.
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
