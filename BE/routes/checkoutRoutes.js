const express = require("express")
const router = express.Router()
const { authenticateUser } = require("../middleware/authentication")
const { createOrderFromCart, handleVnpayReturn } = require("../controllers/checkoutController")

// User creates order and receives VNPay payment URL
router.post("/vnpay", authenticateUser, createOrderFromCart)

// VNPay return URL (configured as VNPAY_RETURN_URL)
router.get("/vnpay-return", handleVnpayReturn)

module.exports = router
