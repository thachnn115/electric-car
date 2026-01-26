const express = require("express")
const router = express.Router()

const { authenticateUser, authorizePermissions } = require("../middleware/authentication")

const {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  createOrderOfflineAdmin,
  userCancelOrder,
} = require("../controllers/orderController")

router
  .route("/")
  .post(authenticateUser, createOrder)
  .get(authenticateUser, authorizePermissions("admin"), getAllOrders)

router
  .route("/admin/offline")
  .post(authenticateUser, authorizePermissions("admin"), createOrderOfflineAdmin)

router.route("/showAllMyOrders").get(authenticateUser, getCurrentUserOrder)

router.patch("/:id/cancel", authenticateUser, userCancelOrder)

router
  .route("/:id")
  .get(authenticateUser, authorizePermissions("admin"), getSingleOrder)
  .patch(authenticateUser, authorizePermissions("admin"), updateOrder)
  .delete(authenticateUser, authorizePermissions("admin"), deleteOrder)

module.exports = router
