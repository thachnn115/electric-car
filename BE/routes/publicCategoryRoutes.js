const express = require("express")
const router = express.Router()
const { getCategoriesPublic, getProductsByCategory } = require("../controllers/categoryPublicController")

router.get("/", getCategoriesPublic)
router.get("/:slug/products", getProductsByCategory)

module.exports = router
