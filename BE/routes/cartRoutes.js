const express = require("express")
const router = express.Router()
const { authenticateUser, authorizePermissions } = require("../middleware/authentication")
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController")

// All routes require authenticated user (role user/admin both allowed, checkPermissions handled via ownership)
router.post("/", authenticateUser, addToCart)
router.get("/", authenticateUser, getCart)
router.patch("/", authenticateUser, updateCartItem)
router.delete("/item", authenticateUser, removeCartItem)
router.delete("/", authenticateUser, clearCart)

module.exports = router
