const mongoose = require("mongoose")

const SingleOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String, required: true },
    image: { type: String },
  },
  { _id: false }
)

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User" },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },
    shippingAddress: { type: String, required: true },

    orderItems: {
      type: [SingleOrderItemSchema],
      validate: [(arr) => Array.isArray(arr) && arr.length > 0, "Order must have at least one item"],
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountCode: { type: String, default: "" },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    finalTotal: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "VNPAY" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },

    clientSecret: { type: String },
    paymentIntentID: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Order", OrderSchema)
