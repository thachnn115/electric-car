const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")

// Public: get all categories
const getCategoriesPublic = async (req, res) => {
  const categories = await Category.find({}).sort("name")
  res.status(StatusCodes.OK).json({ total_categories: categories.length, categories })
}

// Public: get products by category slug or id
const getProductsByCategory = async (req, res) => {
  const { slug } = req.params
  let category = await Category.findOne({ slug })
  if (!category) {
    // try id
    category = await Category.findById(slug)
  }
  if (!category) {
    throw new CustomError.NotFoundError("Category not found")
  }

  const products = await Product.find({ category: category._id })
  res.status(StatusCodes.OK).json({
    category: { id: category._id, name: category.name, slug: category.slug },
    total_products: products.length,
    products,
  })
}

module.exports = {
  getCategoriesPublic,
  getProductsByCategory,
}
