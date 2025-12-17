const crypto = require("crypto")
const qs = require("qs")

// Build payment URL for VNPay sandbox
const createPaymentUrl = ({ amount, orderId, orderInfo, ipAddr, returnUrl }) => {
  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100, // VNPay expects amount in smallest currency unit
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "0.0.0.0",
    vnp_CreateDate: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
  }

  const signData = qs.stringify(vnpParams, { encode: false })
  const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET)
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")
  vnpParams.vnp_SecureHash = secureHash

  const vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  return `${vnpUrl}?${qs.stringify(vnpParams, { encode: true })}`
}

// Verify return data from VNPay
const verifyReturn = (query) => {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query
  const sorted = {}
  Object.keys(rest)
    .sort()
    .forEach((key) => {
      sorted[key] = rest[key]
    })
  const signData = qs.stringify(sorted, { encode: false })
  const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET)
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")
  return signed === vnp_SecureHash
}

module.exports = {
  createPaymentUrl,
  verifyReturn,
}
