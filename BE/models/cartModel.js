const mongoose = require("mongoose")

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String, required: true },
    image: { type: String, default: "" },
  },
  { _id: false }
)

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", unique: true, required: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Cart", CartSchema)
