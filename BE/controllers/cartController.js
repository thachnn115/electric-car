const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const CustomError = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { checkPermissions } = require("../utils")

// Ensure cart exists
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId })
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] })
  }
  return cart
}

// Add item to cart (add or increment)
const addToCart = async (req, res) => {
  const { productId, quantity = 1, color } = req.body
  if (!productId || !color) {
    throw new CustomError.BadRequestError("Please provide productId and color")
  }
  const product = await Product.findById(productId)
  if (!product) throw new CustomError.NotFoundError("Product not found")
  if (quantity < 1) throw new CustomError.BadRequestError("Quantity must be at least 1")

  const cart = await getOrCreateCart(req.user.userId)

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.color === color
  )

  const selectedColor = product.colors?.find((c) => c.name === color)
  const itemPrice = selectedColor?.price !== undefined && selectedColor?.price !== null
    ? selectedColor.price
    : (product.price || 0)

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += Number(quantity)
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      price: itemPrice,
      quantity: Number(quantity),
      color,
      image: product.images?.[0] || "",
    })
  }

  await cart.save()
  res.status(StatusCodes.OK).json({ cart })
}

// Get current user's cart
const getCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user.userId)
  await cart.populate("items.product", "name price images colors")
  res.status(StatusCodes.OK).json({ cart })
}

// Update item quantity or remove
const updateCartItem = async (req, res) => {
  const { productId, color, quantity } = req.body
  if (!productId || !color || quantity === undefined) {
    throw new CustomError.BadRequestError("Please provide productId, color, and quantity")
  }
  const cart = await getOrCreateCart(req.user.userId)

  const idx = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.color === color
  )
  if (idx === -1) throw new CustomError.NotFoundError("Item not found in cart")

  if (quantity <= 0) {
    cart.items.splice(idx, 1)
  } else {
    cart.items[idx].quantity = Number(quantity)
  }

  await cart.save()
  res.status(StatusCodes.OK).json({ cart })
}

// Remove item
const removeCartItem = async (req, res) => {
  const { productId, color } = req.body
  if (!productId || !color) {
    throw new CustomError.BadRequestError("Please provide productId and color")
  }
  const cart = await getOrCreateCart(req.user.userId)
  cart.items = cart.items.filter(
    (item) => !(item.product.toString() === productId && item.color === color)
  )
  await cart.save()
  res.status(StatusCodes.OK).json({ cart })
}

// Clear cart
const clearCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user.userId)
  cart.items = []
  await cart.save()
  res.status(StatusCodes.OK).json({ cart })
}

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
}
