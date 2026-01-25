const express = require("express")
const router = express.Router()
const { authenticateUser } = require("../middleware/authentication")
const { createOrderFromCart, createGuestOrder, handleVnpayReturn } = require("../controllers/checkoutController")

// Guest creates order (no authentication required)
router.post("/guest", createGuestOrder)

// User creates order and receives VNPay payment URL
router.post("/vnpay", authenticateUser, createOrderFromCart)

// VNPay return URL (configured as VNPAY_RETURN_URL)
router.get("/vnpay-return", handleVnpayReturn)

module.exports = router
