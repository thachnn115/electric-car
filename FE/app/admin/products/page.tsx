"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Loader2, X, Upload } from "lucide-react"
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
import { productsApi, categoriesApi } from "@/lib/api"
import { formatCurrency, getProductImageUrl } from "@/lib/utils"
import type { Product, Category } from "@/lib/types"
import { getErrorMessage } from "@/lib/error-handler"
import { toast } from "sonner"
import {
  validateImageFile,
  validateProductForm,
  normalizeHexColor,
  isValidPartialHexColor,
  readFileAsDataURL,
  getStockBadgeVariant,
  type ColorFormData,
  type SpecFormData,
} from "@/lib/product-helpers"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
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
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [colors, setColors] = useState<ColorFormData[]>([
    { id: crypto.randomUUID(), name: "", hex: "#000000", image: null },
  ])
  const [specs, setSpecs] = useState<SpecFormData[]>([{ id: crypto.randomUUID(), label: "", value: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await productsApi.getAllAdmin()
      setProducts(response.products)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAllAdmin()
      setCategories(response.categories)
    } catch (error) {
      toast.error(getErrorMessage(error))
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
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, toast])

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [products, searchQuery],
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
    setGalleryImages([])
    setGalleryPreviews([])
    setColors([{ id: crypto.randomUUID(), name: "", hex: "#000000", image: null }])
    setSpecs([{ id: crypto.randomUUID(), label: "", value: "" }])
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
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
    setGalleryImages([])
    setGalleryPreviews(product.images || [])
    setColors(
      product.colors && product.colors.length > 0
        ? product.colors.map((color) => ({
            id: crypto.randomUUID(),
            name: color.name,
            hex: color.hex,
            image: null,
            preview: color.image,
            price: color.price?.toString() || "",
            originalPrice: color.originalPrice?.toString() || "",
          }))
        : [{ id: crypto.randomUUID(), name: "", hex: "#000000", image: null, price: "", originalPrice: "" }],
    )
    setSpecs(
      product.specs && product.specs.length > 0
        ? product.specs.map((spec) => ({ id: crypto.randomUUID(), ...spec }))
        : [{ id: crypto.randomUUID(), label: "", value: "" }],
    )
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }


  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const invalidFiles: string[] = []
    const validFiles: File[] = []

    files.forEach((file) => {
      const error = validateImageFile(file)
      if (error) {
        invalidFiles.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      toast.error(invalidFiles.join("\n"))
    }

    if (validFiles.length === 0) return

    setGalleryImages((prev) => [...prev, ...validFiles])
    try {
      const previewPromises = validFiles.map((file) => readFileAsDataURL(file))
      const newPreviews = await Promise.all(previewPromises)
      setGalleryPreviews((prev) => [...prev, ...newPreviews])
    } catch (error) {
      toast.error("Không thể đọc file ảnh")
    }
  }

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index))
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const addColor = () => {
    setColors((prev) => [...prev, { id: crypto.randomUUID(), name: "", hex: "#000000", image: null }])
  }

  const removeColor = (id: string) => {
    setColors((prev) => prev.filter((color) => color.id !== id))
  }

  const updateColor = useCallback((id: string, field: "name" | "hex" | "price" | "originalPrice", value: string) => {
    if (field === "hex") {
      const hexValue = normalizeHexColor(value)
      if (!isValidPartialHexColor(hexValue)) {
        return
      }
      setColors((prev) => prev.map((color) => (color.id === id ? { ...color, hex: hexValue } : color)))
    } else {
      setColors((prev) => prev.map((color) => (color.id === id ? { ...color, [field]: value } : color)))
    }
  }, [])

  const handleColorImageChange = async (id: string, file: File | null) => {
    if (!file) {
      setColors((prev) => prev.map((color) => (color.id === id ? { ...color, image: null, preview: undefined } : color)))
      return
    }

    const error = validateImageFile(file)
    if (error) {
      toast.error(`Lỗi upload ảnh màu: ${error}`)
      return
    }

    setColors((prev) => prev.map((color) => (color.id === id ? { ...color, image: file } : color)))

    try {
      const preview = await readFileAsDataURL(file)
      setColors((prev) => prev.map((color) => (color.id === id ? { ...color, preview } : color)))
    } catch (error) {
      toast.error("Không thể đọc file ảnh")
    }
  }

  const addSpec = () => {
    setSpecs((prev) => [...prev, { id: crypto.randomUUID(), label: "", value: "" }])
  }

  const removeSpec = (id: string) => {
    setSpecs((prev) => prev.filter((spec) => spec.id !== id))
  }

  const updateSpec = (id: string, field: "label" | "value", value: string) => {
    setSpecs((prev) => prev.map((spec) => (spec.id === id ? { ...spec, [field]: value } : spec)))
  }

  const validColors = useMemo(
    () =>
      colors.filter((c) => {
        const hasName = c.name && c.name.trim().length > 0
        const hasHex = c.hex && /^#[0-9A-Fa-f]{6}$/.test(c.hex)
        const hasImage = c.image || c.preview
        return hasName && hasHex && hasImage
      }),
    [colors],
  )

  const handleSave = useCallback(async () => {
    const validationError = validateProductForm(formData, galleryImages, galleryPreviews, colors)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      if (selectedProduct) {
        const colorsWithNewImages = validColors.filter((c) => c.image !== null)
        const hasNewColorImages = colorsWithNewImages.length > 0
        const hasNewGalleryImages = galleryImages.length > 0

        if (hasNewColorImages || hasNewGalleryImages) {
          const formDataToSend = new FormData()
          formDataToSend.append("name", formData.name)
          formDataToSend.append("price", formData.price)
          if (formData.originalPrice) formDataToSend.append("originalPrice", formData.originalPrice)
          formDataToSend.append("shortDescription", formData.shortDescription)
          formDataToSend.append("description", formData.description)
          formDataToSend.append("category", formData.category)
          formDataToSend.append("stock", formData.stock)

          if (hasNewGalleryImages) {
            galleryImages.forEach((file) => {
              formDataToSend.append("gallery", file)
            })
          } else {
            formDataToSend.append("images", JSON.stringify(galleryPreviews))
          }

          const colorsData = validColors.map((c) => ({
            name: c.name,
            hex: c.hex,
            image: c.image ? null : (c.preview || ""),
            hasNewImage: c.image !== null,
            price: c.price && c.price.trim() !== "" ? c.price : undefined,
            originalPrice: c.originalPrice && c.originalPrice.trim() !== "" ? c.originalPrice : undefined,
          }))
          formDataToSend.append("colors", JSON.stringify(colorsData))

          validColors.forEach((color) => {
            if (color.image) {
              formDataToSend.append("colorImages", color.image)
            }
          })

          const validSpecs = specs.filter((s) => s.label && s.value)
          if (validSpecs.length > 0) {
            formDataToSend.append("specs", JSON.stringify(validSpecs))
          }

          await productsApi.updateWithFormData(selectedProduct._id, formDataToSend)
        } else {
          await productsApi.update(selectedProduct._id, {
            name: formData.name,
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
            shortDescription: formData.shortDescription,
            description: formData.description,
            category: formData.category,
            stock: Number(formData.stock),
            colors: validColors.map((c) => ({
              name: c.name,
              hex: c.hex,
              image: c.preview || "",
              price: c.price && c.price.trim() !== "" ? Number(c.price) : undefined,
              originalPrice: c.originalPrice && c.originalPrice.trim() !== "" ? Number(c.originalPrice) : undefined,
            })),
            specs: specs.filter((s) => s.label && s.value),
          })
        }
        toast.success("Đã cập nhật sản phẩm thành công")
      } else {
        // Validate that all colors have image files (not just preview URLs)
        const colorsWithFiles = validColors.filter((c) => c.image !== null)
        if (colorsWithFiles.length !== validColors.length) {
          toast.error("Tất cả màu sắc phải có file ảnh. Vui lòng upload ảnh cho tất cả màu.")
          setIsSubmitting(false)
          return
        }

        const formDataToSend = new FormData()
        formDataToSend.append("name", formData.name)
        formDataToSend.append("price", formData.price)
        if (formData.originalPrice) formDataToSend.append("originalPrice", formData.originalPrice)
        formDataToSend.append("shortDescription", formData.shortDescription)
        formDataToSend.append("description", formData.description)
        formDataToSend.append("category", formData.category)
        formDataToSend.append("stock", formData.stock)

        // Append gallery images - backend expects req.files.gallery
        galleryImages.forEach((file) => {
          formDataToSend.append("gallery", file)
        })

        // Prepare colors data (without image URLs, as images will be sent separately)
        const colorsData = validColors.map((c) => ({
          name: c.name,
          hex: c.hex,
          price: c.price && c.price.trim() !== "" ? c.price : undefined,
          originalPrice: c.originalPrice && c.originalPrice.trim() !== "" ? c.originalPrice : undefined,
        }))
        formDataToSend.append("colors", JSON.stringify(colorsData))

        // Append color images - backend expects req.files.colorImages
        // IMPORTANT: Order must match colors array order, and count must match
        validColors.forEach((color) => {
          if (color.image) {
            formDataToSend.append("colorImages", color.image)
          }
        })

        // Append specs if any
        const validSpecs = specs.filter((s) => s.label && s.value)
        if (validSpecs.length > 0) {
          formDataToSend.append("specs", JSON.stringify(validSpecs))
        }

        await productsApi.create(formDataToSend)
        toast.success("Đã thêm sản phẩm mới thành công")
      }
      setIsDialogOpen(false)
      void fetchProducts()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, galleryImages, galleryPreviews, colors, validColors, specs, selectedProduct, fetchProducts, toast])

  const handleDelete = async () => {
    if (selectedProduct) {
      try {
        await productsApi.delete(selectedProduct._id)
        toast.success("Đã xóa sản phẩm thành công")
        setIsDeleteDialogOpen(false)
        void fetchProducts()
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    }
  }

  const getCategoryName = (category: Product["category"]): string => {
    if (typeof category === "string") {
      return categories.find((c) => c._id === category)?.name || category
    }
    return category.name
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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
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
                  {filteredProducts.map((product) => (
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
                        <Badge variant={getStockBadgeVariant(product.stock)}>
                          {product.stock}
                        </Badge>
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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? "Chỉnh sửa thông tin sản phẩm" : "Điền thông tin để thêm sản phẩm mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4 pr-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên sản phẩm *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: VinFast VF 8"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Giá bán *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0)) {
                    setFormData((prev) => ({ ...prev, price: value }))
                  }
                }}
                placeholder="VD: 1000000000"
              />
            </div>
              <div className="grid gap-2">
                <Label htmlFor="originalPrice">Giá gốc (tùy chọn)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.originalPrice}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0)) {
                      setFormData((prev) => ({ ...prev, originalPrice: value }))
                    }
                  }}
                  placeholder="VD: 1200000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
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
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0 && Number.isInteger(Number(value)))) {
                      setFormData((prev) => ({ ...prev, stock: value }))
                    }
                  }}
                  placeholder="VD: 10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Mô tả ngắn *</Label>
              <Input
                id="shortDescription"
                maxLength={250}
                value={formData.shortDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                placeholder="Mô tả ngắn gọn về sản phẩm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.shortDescription.length}/250 ký tự
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả chi tiết *</Label>
              <Textarea
                id="description"
                maxLength={3000}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về sản phẩm"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/3000 ký tự
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Ảnh sản phẩm (Gallery) *</Label>
              <div className="flex flex-wrap gap-2">
                {galleryPreviews.map((preview, index) => (
                  <div key={`gallery-${index}-${preview.substring(0, 20)}`} className="relative group">
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
                      <Image src={preview} alt={`Gallery ${index + 1}`} fill className="object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Thêm ít nhất một ảnh sản phẩm</p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Màu sắc *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addColor}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm màu
                </Button>
              </div>
              <div className="space-y-3">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className="flex gap-3 items-start p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="grid gap-3 flex-1">
                      <Input
                        placeholder="Tên màu (VD: Đỏ, Xanh)"
                        value={color.name}
                        onChange={(e) => updateColor(color.id, "name", e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(color.id, "hex", e.target.value)}
                          className="w-20 h-10 p-1"
                        />
                        <Input
                          type="text"
                          placeholder="#000000"
                          value={color.hex}
                          onChange={(e) => updateColor(color.id, "hex", e.target.value)}
                          className="flex-1"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          maxLength={7}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium">Giá bán (tùy chọn)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="Để trống dùng giá sản phẩm"
                            value={color.price || ""}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0)) {
                                updateColor(color.id, "price", value)
                              }
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium">Giá gốc (tùy chọn)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="Để trống dùng giá sản phẩm"
                            value={color.originalPrice || ""}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0)) {
                                updateColor(color.id, "originalPrice", value)
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center px-3 py-2 border border-border rounded-md cursor-pointer hover:bg-accent">
                          <Upload className="h-4 w-4 mr-2" />
                          <span className="text-sm">Chọn ảnh màu</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleColorImageChange(color.id, e.target.files?.[0] || null)}
                          />
                        </label>
                        {colors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeColor(color.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {color.preview && (
                        <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                          <Image src={color.preview} alt={color.name || "Color preview"} fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Mỗi màu phải có tên, mã màu và ảnh</p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Thông số kỹ thuật (Specs)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm spec
                </Button>
              </div>
              <div className="space-y-2">
                {specs.map((spec) => (
                  <div key={spec.id} className="flex gap-2">
                    <Input
                      placeholder="Nhãn (VD: Công suất)"
                      value={spec.label}
                      onChange={(e) => updateSpec(spec.id, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Giá trị (VD: 300kW)"
                      value={spec.value}
                      onChange={(e) => updateSpec(spec.id, "value", e.target.value)}
                      className="flex-1"
                    />
                    {specs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpec(spec.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                selectedProduct ? "Cập nhật" : "Thêm mới"
              )}
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
    </>
  )
}
