const Order = require("../models/orderModel")
const Product = require("../models/productModel")
const Discount = require("../models/discountModel")
const CustomError = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { checkPermissions } = require("../utils")

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

const buildItemsFromRequest = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CustomError.BadRequestError("Please provide order items")
  }
  const built = []
  for (const item of items) {
    const { productId, quantity, color } = item
    if (!productId || !quantity || !color) {
      throw new CustomError.BadRequestError("Each item needs productId, quantity, color")
    }
    const product = await Product.findById(productId)
    if (!product) throw new CustomError.NotFoundError(`Product not found: ${productId}`)
    if (product.stock < quantity) {
      throw new CustomError.BadRequestError(`Not enough stock for ${product.name}`)
    }
    const selectedColor = product.colors?.find((c) => c.name === color)
    const itemPrice = selectedColor?.price !== undefined && selectedColor?.price !== null
      ? selectedColor.price
      : (product.price || 0)
    built.push({
      product: product._id,
      name: product.name,
      price: itemPrice,
      quantity: Number(quantity),
      color,
      image: product.images?.[0] || "",
    })
  }
  return built
}

// ** ===================  GET ALL ORDERS  ===================
const getAllOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .populate("orderItems.product", "name price images colors")
    .sort("-createdAt")

  res.status(StatusCodes.OK).json({ total_orders: orders.length, orders })
}

// ** ===================  GET SINGLE ORDERS  ===================
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params
  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("orderItems.product", "name price images colors")
  if (!order) {
    throw new CustomError.NotFoundError("Order not found")
  }
  checkPermissions(req.user, order.user)
  res.status(StatusCodes.OK).json({ order })
}

// ** ===================  GET CURRENT USER ORDERS  ===================
const getCurrentUserOrder = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId })
    .populate("orderItems.product", "name price images colors")
    .sort("-createdAt")
  res.status(StatusCodes.OK).json({ total_orders: orders.length, orders })
}

// ** ===================  CREATE ORDER  ===================
const createOrder = async (req, res) => {
  const { orderItems, subtotal, discount = 0, shippingFee = 0, tax = 0, total, finalTotal, shippingAddress, paymentMethod, userPhone } =
    req.body

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    throw new CustomError.BadRequestError("Please provide order items")
  }
  if (!subtotal || !total || !finalTotal) {
    throw new CustomError.BadRequestError("Please provide subtotal, total, and finalTotal")
  }
  if (!shippingAddress) {
    throw new CustomError.BadRequestError("Please provide shipping address")
  }

  const order = await Order.create({
    user: req.user.userId,
    userName: req.user.name,
    userEmail: req.user.email || "",
    userPhone: userPhone || "",
    shippingAddress,
    orderItems,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    finalTotal,
    paymentMethod: paymentMethod || "VNPAY",
  })

  res.status(StatusCodes.CREATED).json({ order })
}

// ** ===================  UPDATE ORDER  ===================
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params
  const { status, paymentStatus } = req.body

  const order = await Order.findById(orderId)
  if (!order) {
    throw new CustomError.NotFoundError("Order not found")
  }

  if (status) {
    const allowedStatus = ["pending", "confirmed", "shipping", "delivered", "cancelled"]
    if (!allowedStatus.includes(status)) {
      throw new CustomError.BadRequestError("Invalid status")
    }
    order.status = status
  }

  if (paymentStatus) {
    const allowedPaymentStatus = ["pending", "paid", "failed"]
    if (!allowedPaymentStatus.includes(paymentStatus)) {
      throw new CustomError.BadRequestError("Invalid payment status")
    }
    order.paymentStatus = paymentStatus
  }

  await order.save()
  res.status(StatusCodes.OK).json({ order })
}

// ** ===================  DELETE ORDER  ===================
const deleteOrder = async (req, res) => {
  const { id: orderId } = req.params
  const order = await Order.findByIdAndDelete(orderId)
  if (!order) {
    throw new CustomError.NotFoundError("Order not found")
  }
  res.status(StatusCodes.OK).json({ msg: "Order deleted" })
}

// ** ===================  CREATE ORDER OFFLINE (ADMIN)  ===================
const createOrderOfflineAdmin = async (req, res) => {
  const { items, discountCode, userId, userName, userEmail, userPhone, shippingAddress, paymentStatus, status, paymentMethod } =
    req.body

  // build items from product ids and validate stock
  const orderItems = await buildItemsFromRequest(items)

  // validate discount
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

  const { subtotal, discountValue, shippingFee, tax, total, finalTotal } = calculateTotals(orderItems, discountDoc)

  const order = await Order.create({
    user: userId || req.user.userId,
    userName: userName || req.user.name,
    userEmail: userEmail || "",
    userPhone: userPhone || "",
    shippingAddress: shippingAddress || "",
    orderItems,
    subtotal,
    discount: discountValue,
    discountCode: discountDoc ? discountDoc.code : "",
    shippingFee,
    tax,
    total,
    finalTotal,
    status: status || "confirmed",
    paymentStatus: paymentStatus || "paid",
    paymentMethod: paymentMethod || "OFFLINE",
  })

  if (discountDoc) {
    await Discount.findOneAndUpdate({ code: discountDoc.code }, { $inc: { usedCount: 1 } }, { new: true })
  }

  res.status(StatusCodes.CREATED).json({ order })
}

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  createOrderOfflineAdmin,
}
