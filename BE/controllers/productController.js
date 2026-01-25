const Product = require("../models/productModel")
const CustomError = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { uploadBuffer } = require("../utils/cloudinary")

const normalizeToArray = (value) => (Array.isArray(value) ? value : [value])

const CLOUDINARY_BASE_FOLDER = process.env.CLOUDINARY_PRODUCT_FOLDER || "electric-motorcycle/products"
const uploadImageToCloudinary = async (file, folder = CLOUDINARY_BASE_FOLDER) => {
  if (!file || !file.mimetype || !file.mimetype.startsWith("image")) {
    throw new CustomError.BadRequestError("Please upload image file")
  }

  const result = await uploadBuffer(file.data, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
  })

  return result.secure_url
}

// ** ===================  CREATE PRODUCT  ===================
const createProduct = async (req, res) => {
  const body = { ...req.body }

  // Parse stringified JSON inputs if sent via form-data
  if (typeof body.colors === "string") body.colors = JSON.parse(body.colors)
  if (typeof body.images === "string") body.images = JSON.parse(body.images)
  if (typeof body.specs === "string") body.specs = JSON.parse(body.specs)

  // Upload gallery images locally if provided via form-data under key "gallery"
  if (req.files && req.files.gallery) {
    const galleryFiles = normalizeToArray(req.files.gallery)
    const uploads = await Promise.all(
      galleryFiles.map((file) => uploadImageToCloudinary(file, `${CLOUDINARY_BASE_FOLDER}/gallery`))
    )
    body.images = uploads
  }

  // Upload color images locally if provided via form-data under key "colorImages"
  if (req.files && req.files.colorImages) {
    if (!body.colors || !Array.isArray(body.colors)) {
      throw new CustomError.BadRequestError("Please provide colors array to map colorImages")
    }
    const colorFiles = normalizeToArray(req.files.colorImages)
    if (colorFiles.length !== body.colors.length) {
      throw new CustomError.BadRequestError("colorImages count must match colors length")
    }
    const uploads = await Promise.all(
      colorFiles.map((file) => uploadImageToCloudinary(file, `${CLOUDINARY_BASE_FOLDER}/colors`))
    )
    body.colors = body.colors.map((color, idx) => ({
      ...color,
      image: uploads[idx],
    }))
  }

  // Process color prices: if first color doesn't have price, use product price
  if (body.colors && Array.isArray(body.colors) && body.colors.length > 0) {
    body.colors = body.colors.map((color, idx) => {
      const colorPrice = color.price !== undefined && color.price !== null && color.price !== "" ? Number(color.price) : undefined
      const colorOriginalPrice = color.originalPrice !== undefined && color.originalPrice !== null && color.originalPrice !== "" ? Number(color.originalPrice) : undefined
      
      if (idx === 0 && !colorPrice && body.price) {
        return {
          ...color,
          price: Number(body.price),
          originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
        }
      }
      
      return {
        ...color,
        price: colorPrice,
        originalPrice: colorOriginalPrice,
      }
    })
  }

  // Validate required media fields
  if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
    throw new CustomError.BadRequestError("Please provide product images")
  }
  if (!body.colors || !Array.isArray(body.colors) || body.colors.some((c) => !c.image)) {
    throw new CustomError.BadRequestError("Each color must include an image")
  }

  body.user = req.user.userId
  const product = await Product.create(body)
  res.status(StatusCodes.CREATED).json({ product })
}

// ** ===================  GET ALL PRODUCTS  ===================
const getAllProducts = async (req, res) => {
  const product = await Product.find({})
  res.status(StatusCodes.OK).json({ total_products: product.length, product })
}

// Admin: get all with details
const getAllProductsAdmin = async (req, res) => {
  const products = await Product.find({})
    .populate("category", "name slug")
    .populate("user", "name email")
    .sort("-createdAt")
  res.status(StatusCodes.OK).json({ total_products: products.length, products })
}

// Admin: search products with filters
const searchProductsAdmin = async (req, res) => {
  const { q, category, minPrice, maxPrice, inStock } = req.query
  const query = {}
  const or = []

  if (q) {
    const regex = new RegExp(q, "i")
    or.push(
      { name: regex },
      { description: regex },
      { shortDescription: regex },
      { "colors.name": regex },
      { "colors.hex": regex },
      { "colors.image": regex },
      { "specs.label": regex },
      { "specs.value": regex }
    )
    const num = Number(q)
    if (!Number.isNaN(num)) {
      or.push(
        { price: num },
        { originalPrice: num },
        { stock: num },
        { rating: num },
        { reviews: num }
      )
    }
    query.$or = or
  }
  if (category) {
    query.category = category
  }
  if (minPrice || maxPrice) {
    query.price = {}
    if (minPrice) query.price.$gte = Number(minPrice)
    if (maxPrice) query.price.$lte = Number(maxPrice)
  }
  if (inStock === "true") {
    query.stock = { $gt: 0 }
  } else if (inStock === "false") {
    query.stock = { $lte: 0 }
  }

  const products = await Product.find(query)
    .populate("category", "name slug")
    .populate("user", "name email")
    .sort("-createdAt")

  res.status(StatusCodes.OK).json({ total_products: products.length, products })
}

// ** ===================  GET SINGLE PRODUCT  ===================
const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params
  const product = await Product.findOne({ _id: productId }).populate("reviewsList")
  if (!product) {
    throw new CustomError.BadRequestError(`No product with the id ${productId}`)
  }
  res.status(StatusCodes.OK).json({ product })
}

// ** ===================  UPDATE PRODUCT  ===================
const updateProduct = async (req, res) => {
  const { id: productId } = req.params
  const body = { ...req.body }

  // Parse stringified JSON inputs if sent via form-data
  if (typeof body.colors === "string") body.colors = JSON.parse(body.colors)
  if (typeof body.images === "string") body.images = JSON.parse(body.images)
  if (typeof body.specs === "string") body.specs = JSON.parse(body.specs)

  // Upload gallery images if provided
  if (req.files && req.files.gallery) {
    const galleryFiles = normalizeToArray(req.files.gallery)
    const uploads = await Promise.all(
      galleryFiles.map((file) => uploadImageToCloudinary(file, `${CLOUDINARY_BASE_FOLDER}/gallery`))
    )
    body.images = uploads
  }

  // Upload color images if provided
  if (req.files && req.files.colorImages) {
    if (!body.colors || !Array.isArray(body.colors)) {
      throw new CustomError.BadRequestError("Please provide colors array to map colorImages")
    }
    const colorFiles = normalizeToArray(req.files.colorImages)
    const uploads = await Promise.all(
      colorFiles.map((file) => uploadImageToCloudinary(file, `${CLOUDINARY_BASE_FOLDER}/colors`))
    )
    
    let uploadIndex = 0
    body.colors = body.colors.map((color) => {
      if (color.hasNewImage || color.image === null) {
        if (uploadIndex < uploads.length) {
          const uploadedUrl = uploads[uploadIndex]
          uploadIndex++
          const { hasNewImage, ...colorWithoutFlag } = color
          return {
            ...colorWithoutFlag,
            image: uploadedUrl,
          }
        }
      }
      const { hasNewImage, ...colorWithoutFlag } = color
      return colorWithoutFlag
    })
  }

  // Process color prices: if first color doesn't have price, use product price
  if (body.colors && Array.isArray(body.colors) && body.colors.length > 0) {
    const existingProduct = await Product.findById(productId)
    const basePrice = body.price !== undefined ? Number(body.price) : (existingProduct?.price || 0)
    const baseOriginalPrice = body.originalPrice !== undefined ? (body.originalPrice ? Number(body.originalPrice) : undefined) : existingProduct?.originalPrice

    body.colors = body.colors.map((color, idx) => {
      const colorPrice = color.price !== undefined && color.price !== null && color.price !== "" ? Number(color.price) : undefined
      const colorOriginalPrice = color.originalPrice !== undefined && color.originalPrice !== null && color.originalPrice !== "" ? Number(color.originalPrice) : undefined
      
      if (idx === 0 && !colorPrice && basePrice) {
        return {
          ...color,
          price: basePrice,
          originalPrice: baseOriginalPrice,
        }
      }
      
      return {
        ...color,
        price: colorPrice,
        originalPrice: colorOriginalPrice,
      }
    })
  }

  const product = await Product.findOneAndUpdate({ _id: productId }, body, {
    new: true,
    runValidators: true,
  })
  if (!product) {
    throw new CustomError.BadRequestError(`No product with the id ${productId}`)
  }
  res.status(StatusCodes.OK).json({ product })
}

// ** ===================  DELETE PRODUCT  ===================
const deleteProduct = async (req, res) => {
  const { id: productId } = req.params
  const product = await Product.findOneAndDelete({ _id: productId })
  if (!product) {
    throw new CustomError.BadRequestError(`No product with the id ${productId}`)
  }
  await product.remove()
  res.status(StatusCodes.OK).json({ msg: "Success! Product removed" })
}

// ** ===================  UPLOAD IMAGE PRODUCT  ===================
const uploadImage = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError("No File Uploaded")
  }
  const productImage = req.files.image

  const imagePath = await uploadImageToCloudinary(productImage, `${CLOUDINARY_BASE_FOLDER}/single`)

  res.status(StatusCodes.OK).json({
    image: imagePath,
  })
}

module.exports = {
  createProduct,
  getAllProducts,
  searchProductsAdmin,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  uploadImage,
}
