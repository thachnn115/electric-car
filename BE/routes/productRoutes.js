const express = require("express")
const router = express.Router()

const {
  createProduct,
  getAllProducts,
  getAllProductsAdmin,
  searchProductsAdmin,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require("../controllers/productController")
const { authenticateUser, authorizePermissions } = require("../middleware/authentication")

const { getSingleProductReviews } = require("../controllers/reviewController")

router
  .route("/")
  .post([authenticateUser, authorizePermissions("admin")], createProduct)
  .get(getAllProducts) // public: user xem sản phẩm

router
  .route("/admin")
  .get([authenticateUser, authorizePermissions("admin")], getAllProductsAdmin)

router
  .route("/admin/search")
  .get([authenticateUser, authorizePermissions("admin")], searchProductsAdmin)

router.route("/uploadImage").post([authenticateUser, authorizePermissions("admin")], uploadImage)

router
  .route("/:id")
  .get(getSingleProduct)
  .patch([authenticateUser, authorizePermissions("admin")], updateProduct)
  .delete([authenticateUser, authorizePermissions("admin")], deleteProduct)

router.route("/:id/reviews").get(getSingleProductReviews)

module.exports = router
