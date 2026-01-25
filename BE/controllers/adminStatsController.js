const Order = require("../models/orderModel")
const Product = require("../models/productModel")
const User = require("../models/userModel")
const { StatusCodes } = require("http-status-codes")

const defaultStatusCounts = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 }

const getAdminStats = async (req, res) => {
  const { type = "month", year, month } = req.query

  const currentDate = new Date()
  const currentYear = year ? Number(year) : currentDate.getFullYear()
  const currentMonth = month ? Number(month) : currentDate.getMonth() + 1

  let matchStage = {
    paymentStatus: "paid",
    status: { $ne: "cancelled" },
  }

  let groupStage = {}
  let projectStage = {}

  if (type === "year") {
    // Thống kê theo các năm
    groupStage = {
      _id: { year: { $year: "$createdAt" } },
      revenue: { $sum: "$finalTotal" },
      orders: { $sum: 1 },
    }
    projectStage = {
      label: "$_id.year",
      revenue: 1,
      orders: 1,
      _id: 0,
    }
  } else if (type === "month") {
    // Thống kê theo các tháng trong năm cụ thể
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear + 1, 0, 1)

    matchStage.createdAt = {
      $gte: startOfYear,
      $lt: endOfYear,
    }

    groupStage = {
      _id: { month: { $month: "$createdAt" } },
      revenue: { $sum: "$finalTotal" },
      orders: { $sum: 1 },
    }
    projectStage = {
      label: "$_id.month",
      revenue: 1,
      orders: 1,
      _id: 0,
    }
  } else if (type === "day") {
    // Thống kê theo các ngày trong tháng cụ thể
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth, 1)

    matchStage.createdAt = {
      $gte: startOfMonth,
      $lt: endOfMonth,
    }

    groupStage = {
      _id: { day: { $dayOfMonth: "$createdAt" } },
      revenue: { $sum: "$finalTotal" },
      orders: { $sum: 1 },
    }
    projectStage = {
      label: "$_id.day",
      revenue: 1,
      orders: 1,
      _id: 0,
    }
  }

  const [
    orderStatusAggregation,
    revenueAggregation,
    productCount,
    customerCount,
    recentOrders,
    topProductsAggregation,
    statsData,
  ] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$finalTotal" }, paidOrders: { $sum: 1 } } },
    ]),
    Product.countDocuments(),
    User.countDocuments({ role: "user" }),
    Order.find({})
      .select("userName userEmail finalTotal status paymentStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$orderItems" },
      { $match: { "orderItems.product": { $ne: null } } },
      {
        $group: {
          _id: "$orderItems.product",
          quantity: { $sum: "$orderItems.quantity" },
          revenue: { $sum: { $multiply: ["$orderItems.quantity", "$orderItems.price"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          name: "$product.name",
          image: { $arrayElemAt: ["$product.images", 0] },
          quantity: 1,
          revenue: 1,
        },
      },
    ]),
    Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $project: projectStage },
      { $sort: { label: 1 } },
    ]),
  ])

  // Post-processing to fill missing data
  let filledStatsData = []

  if (type === "day") {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate() // Get last day of month
    const statsMap = new Map(statsData.map((item) => [item.label, item]))

    for (let d = 1; d <= daysInMonth; d++) {
      if (statsMap.has(d)) {
        filledStatsData.push(statsMap.get(d))
      } else {
        filledStatsData.push({ label: d, revenue: 0, orders: 0 })
      }
    }
  } else if (type === "month") {
    const statsMap = new Map(statsData.map((item) => [item.label, item]))

    for (let m = 1; m <= 12; m++) {
      if (statsMap.has(m)) {
        filledStatsData.push(statsMap.get(m))
      } else {
        filledStatsData.push({ label: m, revenue: 0, orders: 0 })
      }
    }
  } else if (type === "year") {
    // For year, we want to show a reasonable range. 
    // Let's find the min year from the data or default to recent years.
    // Since we only queried aggregated data, let's assume we want at least the last 5 years 
    // OR if data exists, from the min year in data to current year.

    // Convert label to number just in case
    const yearsInData = statsData.map(d => Number(d.label))
    const minYear = yearsInData.length > 0 ? Math.min(...yearsInData) : currentYear - 4
    const maxYear = currentYear // Always show up to current year

    const statsMap = new Map(statsData.map((item) => [Number(item.label), item]))

    // Ensure we start at least 5 years ago if data is sparse, or from minYear
    const startYear = Math.min(minYear, currentYear - 4)

    for (let y = startYear; y <= maxYear; y++) {
      if (statsMap.has(y)) {
        filledStatsData.push(statsMap.get(y))
      } else {
        filledStatsData.push({ label: y, revenue: 0, orders: 0 })
      }
    }
  } else {
    filledStatsData = statsData;
  }

  const orderStatusCounts = { ...defaultStatusCounts }
  for (const item of orderStatusAggregation) {
    orderStatusCounts[item._id] = item.count
  }

  const totalOrders = Object.values(orderStatusCounts).reduce((sum, value) => sum + value, 0)
  const revenueTotals = revenueAggregation[0] || { totalRevenue: 0, paidOrders: 0 }

  const topProducts = topProductsAggregation.map((item) => ({
    productId: item.productId,
    name: item.name || "Unknown product",
    image: item.image || "",
    quantitySold: item.quantity,
    revenue: item.revenue,
  }))

  res.status(StatusCodes.OK).json({
    totals: {
      revenue: revenueTotals.totalRevenue || 0,
      orders: totalOrders,
      paidOrders: revenueTotals.paidOrders || 0,
      products: productCount,
      customers: customerCount,
      averageOrderValue:
        revenueTotals.paidOrders > 0 ? Number((revenueTotals.totalRevenue / revenueTotals.paidOrders).toFixed(2)) : 0,
    },
    orderStatusCounts,
    chartData: filledStatsData,
    topProducts,
    recentOrders: recentOrders.map((order) => ({
      id: order._id,
      userName: order.userName,
      userEmail: order.userEmail,
      finalTotal: order.finalTotal,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    })),
  })
}

module.exports = { getAdminStats }
