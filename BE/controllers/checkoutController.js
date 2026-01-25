const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const Discount = require("../models/discountModel")
const Order = require("../models/orderModel")
const CustomError = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { createPaymentUrl, verifyReturn } = require("../utils/vnpay")

// Calculate totals from cart items and optional discount
const calculateTotals = (items, discountDoc) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  let discountValue = 0

  if (discountDoc) {
    if (subtotal < (discountDoc.minOrder || 0)) {
      throw new CustomError.BadRequestError("Order does not meet minimum for discount")
    }
    if (discountDoc.discountType === "percent") {
      discountValue = Math.floor((subtotal * discountDoc.discountValue) / 100)
      if (discountDoc.maxDiscount) {
        discountValue = Math.min(discountValue, discountDoc.maxDiscount)
      }
    } else {
      discountValue = discountDoc.discountValue
    }
  }

  const shippingFee = 0
  const tax = 0
  const total = subtotal + shippingFee + tax
  const finalTotal = Math.max(total - discountValue, 0)

  return { subtotal, discountValue, shippingFee, tax, total, finalTotal }
}

// Build order items from cart
const mapOrderItems = (cart) =>
  cart.items.map((item) => ({
    product: item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    color: item.color,
    image: item.image,
  }))

// Validate stock availability
const validateStock = async (cart) => {
  for (const item of cart.items) {
    const product = await Product.findById(item.product)
    if (!product) throw new CustomError.NotFoundError(`Product not found: ${item.product}`)
    if (product.stock < item.quantity) {
      throw new CustomError.BadRequestError(`Not enough stock for ${product.name}`)
    }
  }
}

// Create order and VNPay payment URL
const createOrderFromCart = async (req, res) => {
  const { discountCode, paymentMethod = "VNPAY" } = req.body
  const userId = req.user.userId

  const cart = await Cart.findOne({ user: userId })
  if (!cart || cart.items.length === 0) {
    throw new CustomError.BadRequestError("Cart is empty")
  }

  await validateStock(cart)

  let discountDoc = null
  if (discountCode) {
    discountDoc = await Discount.findOne({ code: discountCode.toUpperCase(), isActive: true })
    const now = new Date()
    if (!discountDoc) throw new CustomError.BadRequestError("Invalid discount code")
    if (discountDoc.startDate && discountDoc.startDate > now) {
      throw new CustomError.BadRequestError("Discount not started")
    }
    if (discountDoc.endDate && discountDoc.endDate < now) {
      throw new CustomError.BadRequestError("Discount expired")
    }
    if (discountDoc.usageLimit && discountDoc.usedCount >= discountDoc.usageLimit) {
      throw new CustomError.BadRequestError("Discount usage limit reached")
    }
  }

  const { subtotal, discountValue, shippingFee, tax, total, finalTotal } = calculateTotals(cart.items, discountDoc)

  // Create order in pending payment status
  const txnRef = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  const baseOrder = {
    user: userId,
    userName: req.user.name,
    userEmail: req.user.email || "",
    userPhone: req.body.userPhone || "",
    shippingAddress: req.body.shippingAddress || "",
    orderItems: mapOrderItems(cart),
    subtotal,
    discount: discountValue,
    discountCode: discountDoc ? discountDoc.code : "",
    shippingFee,
    tax,
    total,
    finalTotal,
    paymentMethod,
  }

  if (paymentMethod === "COD") {
    const order = await Order.create({
      ...baseOrder,
      status: "confirmed",
      paymentStatus: "pending",
    })
    if (discountDoc) {
      await Discount.findOneAndUpdate({ code: discountDoc.code }, { $inc: { usedCount: 1 } }, { new: true })
    }
    await Cart.findOneAndUpdate({ user: userId }, { items: [] })
    return res.status(StatusCodes.CREATED).json({ order, message: "Order placed with COD" })
  }

  // Default: VNPAY
  const order = await Order.create({
    ...baseOrder,
    status: "pending",
    paymentStatus: "pending",
    paymentIntentID: txnRef,
  })

  const paymentUrl = createPaymentUrl({
    amount: finalTotal,
    orderId: txnRef,
    orderInfo: `Order ${order._id}`,
    ipAddr: req.ip || req.connection?.remoteAddress,
    returnUrl: process.env.VNPAY_RETURN_URL,
  })

  res.status(StatusCodes.CREATED).json({ paymentUrl, orderId: order._id, paymentIntentID: txnRef })
}

// Create guest order (no authentication required)
const createGuestOrder = async (req, res) => {
  const { items, discountCode, paymentMethod = "VNPAY", userName, userEmail, userPhone, shippingAddress } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new CustomError.BadRequestError("Please provide order items")
  }

  if (!userName || !userEmail || !userPhone || !shippingAddress) {
    throw new CustomError.BadRequestError("Please provide customer information")
  }

  for (const item of items) {
    const product = await Product.findById(item.productId || item.product)
    if (!product) throw new CustomError.NotFoundError(`Product not found: ${item.productId || item.product}`)
    if (product.stock < item.quantity) {
      throw new CustomError.BadRequestError(`Not enough stock for ${product.name}`)
    }
  }

  let discountDoc = null
  if (discountCode) {
    discountDoc = await Discount.findOne({ code: discountCode.toUpperCase(), isActive: true })
    const now = new Date()
    if (!discountDoc) throw new CustomError.BadRequestError("Invalid discount code")
    if (discountDoc.startDate && discountDoc.startDate > now) {
      throw new CustomError.BadRequestError("Discount not started")
    }
    if (discountDoc.endDate && discountDoc.endDate < now) {
      throw new CustomError.BadRequestError("Discount expired")
    }
    if (discountDoc.usageLimit && discountDoc.usedCount >= discountDoc.usageLimit) {
      throw new CustomError.BadRequestError("Discount usage limit reached")
    }
  }

  const orderItems = items.map((item) => ({
    product: item.productId || item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    color: item.color,
    image: item.image || "",
  }))

  const { subtotal, discountValue, shippingFee, tax, total, finalTotal } = calculateTotals(orderItems, discountDoc)

  const txnRef = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  const baseOrder = {
    user: null,
    userName,
    userEmail,
    userPhone,
    shippingAddress,
    orderItems,
    subtotal,
    discount: discountValue,
    discountCode: discountDoc ? discountDoc.code : "",
    shippingFee,
    tax,
    total,
    finalTotal,
    paymentMethod,
  }

  if (paymentMethod === "COD") {
    const order = await Order.create({
      ...baseOrder,
      status: "confirmed",
      paymentStatus: "pending",
    })
    if (discountDoc) {
      await Discount.findOneAndUpdate({ code: discountDoc.code }, { $inc: { usedCount: 1 } }, { new: true })
    }
    return res.status(StatusCodes.CREATED).json({ order, message: "Order placed with COD" })
  }

  const order = await Order.create({
    ...baseOrder,
    status: "pending",
    paymentStatus: "pending",
    paymentIntentID: txnRef,
  })

  const paymentUrl = createPaymentUrl({
    amount: finalTotal,
    orderId: txnRef,
    orderInfo: `Order ${order._id}`,
    ipAddr: req.ip || req.connection?.remoteAddress,
    returnUrl: process.env.VNPAY_RETURN_URL,
  })

  res.status(StatusCodes.CREATED).json({ paymentUrl, orderId: order._id, paymentIntentID: txnRef })
}

// VNPay return handler
const handleVnpayReturn = async (req, res) => {
  const isValid = verifyReturn(req.query)
  const txnRef = req.query.vnp_TxnRef
  const responseCode = req.query.vnp_ResponseCode

  if (!isValid) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid signature" })
  }

  const order = await Order.findOne({ paymentIntentID: txnRef })
  if (!order) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Order not found" })
  }

  if (responseCode === "00") {
    order.paymentStatus = "paid"
    order.status = "confirmed"
    // Increase discount usage if applied
    if (order.discountCode) {
      await Discount.findOneAndUpdate(
        { code: order.discountCode },
        { $inc: { usedCount: 1 } },
        { new: true }
      )
    }
    // Clear cart
    await Cart.findOneAndUpdate({ user: order.user }, { items: [] })
  } else {
    order.paymentStatus = "failed"
    order.status = "cancelled"
  }

  await order.save()

  return res.status(StatusCodes.OK).json({
    msg: responseCode === "00" ? "Payment success" : "Payment failed",
    orderId: order._id,
    status: order.status,
    paymentStatus: order.paymentStatus,
  })
}

module.exports = {
  createOrderFromCart,
  createGuestOrder,
  handleVnpayReturn,
}
