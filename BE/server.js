require("dotenv").config()
require("express-async-errors")

const express = require("express")
const app = express()
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const fileUpload = require("express-fileupload")
const connectDB = require("./db/connect")

// Routers
const authRouter = require("./routes/authRoutes")
const userRouter = require("./routes/userRoutes")
const productRouter = require("./routes/productRoutes")
const reviewRouter = require("./routes/reviewRoutes")
const orderRouter = require("./routes/orderRoutes")
const categoryRouter = require("./routes/categoryRoutes")
const discountRouter = require("./routes/discountRoutes")
const cartRouter = require("./routes/cartRoutes")
const publicCategoryRouter = require("./routes/publicCategoryRoutes")
const checkoutRouter = require("./routes/checkoutRoutes")

// Middleware
const notFoundMiddleware = require("./middleware/not-found")
const errorHandlerMiddleware = require("./middleware/error-handler")
const swaggerUi = require("swagger-ui-express")
const YAML = require("yamljs")
const swaggerDocument = YAML.load("./docs/swagger.yaml")

// Extra
app.use(morgan("tiny"))
app.use(express.json())
app.use(cookieParser(process.env.JWT_SECRET))
app.use(express.static("./public"))
app.use(fileUpload())

app.get("/", (req, res) => {
  res.send("<h1>Electric Car API</h1>")
})

app.get("/api/v1/", (req, res) => {
  res.send("Electric Car API")
})

// Routes
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/products", productRouter)
app.use("/api/v1/reviews", reviewRouter)
app.use("/api/v1/orders", orderRouter)
app.use("/api/v1/categories", categoryRouter)
app.use("/api/v1/discounts", discountRouter)
app.use("/api/v1/cart", cartRouter)
app.use("/api/v1/public/categories", publicCategoryRouter)
app.use("/api/v1/checkout", checkoutRouter)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Middleware
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 5000
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL)
    const ensureAdminUser = require("./utils/ensureAdminUser")
    await ensureAdminUser()
    app.listen(port, () => console.log(`Server listening on port ${port}...`))
  } catch (error) {
    console.log(error)
  }
}

start()
