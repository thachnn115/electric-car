const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    shortDescription: { type: String, required: true, maxlength: 250 },
    description: { type: String, required: true, maxlength: 3000 },
    images: {
      type: [String],
      default: [],
    },
    colors: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          hex: { type: String, required: true, match: /^#/ },
          image: { type: String, required: true },
          price: { type: Number, min: 0 },
          originalPrice: { type: Number, min: 0 },
        },
      ],
      required: true,
      validate: [(arr) => arr.length > 0, "At least one color is required"],
    },
    category: { type: mongoose.Types.ObjectId, ref: "Category", required: true },
    specs: {
      type: [
        {
          label: { type: String, required: true, trim: true },
          value: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    stock: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

ProductSchema.virtual("reviewsList", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
  justOne: false,
})

ProductSchema.virtual("id").get(function () {
  return this._id.toHexString()
})

ProductSchema.pre("remove", async function () {
  await this.model("Review").deleteMany({ product: this._id })
})

module.exports = mongoose.model("Product", ProductSchema)
