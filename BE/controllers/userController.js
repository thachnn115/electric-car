const User = require("../models/userModel")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const { createTokenUser, attachCookiesToResponse, checkPermissions } = require("../utils")

// Get all users (admin/owner)
const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password")
  res.status(StatusCodes.OK).json({ total_users: users.length, users })
}

// Create user (admin)
const createUserAdmin = async (req, res) => {
  const { name, email, password, role = "user", phone, address, avatar, gender, dateOfBirth } = req.body
  if (!name || !email || !password) {
    throw new CustomError.BadRequestError("Please provide name, email, and password")
  }
  const existing = await User.findOne({ email })
  if (existing) {
    throw new CustomError.BadRequestError("Email already exists")
  }
  const user = await User.create({ name, email, password, role, phone, address, avatar, gender, dateOfBirth })
  const sanitized = user.toObject()
  delete sanitized.password
  res.status(StatusCodes.CREATED).json({ user: sanitized })
}

// Get single user
const getSingleUser = async (req, res) => {
  const { id: userId } = req.params
  const user = await User.findOne({ _id: userId }).select("-password")
  if (!user) {
    throw new CustomError.NotFoundError("User does not exist")
  }
  checkPermissions(req.user, user._id)
  res.status(StatusCodes.OK).json({ user })
}

// Show current user
const showCurrentUser = async (req, res) => {
  // Fetch full user data from database to include all fields
  const user = await User.findOne({ _id: req.user.userId }).select("-password")
  if (!user) {
    throw new CustomError.NotFoundError("User not found")
  }
  res.status(StatusCodes.OK).json({ user })
}

// Update user (self)
const updateUser = async (req, res) => {
  const allowedFields = ["name", "email", "phone", "address", "avatar", "gender", "dateOfBirth"]
  const updates = {}
  
  // Process allowed fields
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new CustomError.BadRequestError("Please provide at least one field to update")
  }

  // Sanitize and validate updates
  if (updates.name !== undefined) {
    updates.name = updates.name.trim()
    if (!updates.name || updates.name.length < 3) {
      throw new CustomError.BadRequestError("Name must be at least 3 characters")
    }
  }

  if (updates.email !== undefined) {
    updates.email = updates.email.trim().toLowerCase()
    if (!updates.email || !updates.email.includes("@")) {
      throw new CustomError.BadRequestError("Please provide a valid email")
    }
  }

  // Handle optional fields - allow empty string to clear
  if (updates.phone !== undefined) {
    updates.phone = updates.phone ? updates.phone.trim() : ""
  }
  if (updates.address !== undefined) {
    updates.address = updates.address ? updates.address.trim() : ""
  }
  if (updates.avatar !== undefined) {
    updates.avatar = updates.avatar || ""
  }
  if (updates.gender !== undefined) {
    // Allow empty string or valid enum values
    if (updates.gender !== "" && !["male", "female", "other"].includes(updates.gender)) {
      throw new CustomError.BadRequestError("Gender must be one of: male, female, other")
    }
    updates.gender = updates.gender || ""
  }
  if (updates.dateOfBirth !== undefined) {
    // Empty string means clear the field (set to undefined)
    if (updates.dateOfBirth === "" || updates.dateOfBirth === null) {
      updates.dateOfBirth = undefined
    } else {
      // Validate date format
      const date = new Date(updates.dateOfBirth)
      if (Number.isNaN(date.getTime())) {
        throw new CustomError.BadRequestError("Please provide a valid date of birth")
      }
      // Check if date is in the future
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (date > today) {
        throw new CustomError.BadRequestError("Date of birth cannot be in the future")
      }
    }
  }

  // Get current user
  const user = await User.findOne({ _id: req.user.userId })
  if (!user) {
    throw new CustomError.NotFoundError("User not found")
  }

  // Check if email is being changed and if new email already exists
  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email })
    if (emailExists) {
      throw new CustomError.BadRequestError("Email already exists")
    }
  }

  // Apply updates
  Object.assign(user, updates)
  await user.save()

  // Update token and cookie with new user data
  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({ res, user: tokenUser })
  res.status(StatusCodes.OK).json({ user: tokenUser })
}

// Update user (admin)
const updateUserAdmin = async (req, res) => {
  const { id: userId } = req.params
  const allowedFields = ["name", "email", "phone", "address", "avatar", "gender", "dateOfBirth", "role", "password"]
  const updates = {}
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  if (Object.keys(updates).length === 0) {
    throw new CustomError.BadRequestError("Please provide value")
  }

  const user = await User.findById(userId)
  if (!user) throw new CustomError.NotFoundError("User does not exist")

  Object.assign(user, updates)
  await user.save()
  const sanitized = user.toObject()
  delete sanitized.password
  res.status(StatusCodes.OK).json({ user: sanitized })
}

// Update user password
const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values")
  }
  const user = await User.findOne({ _id: req.user.userId })
  const isPasswordCorrect = await user.comparePassword(oldPassword)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Wrong password provided")
  }
  user.password = newPassword
  await user.save()
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated" })
}

// Delete user (admin)
const deleteUserAdmin = async (req, res) => {
  const { id: userId } = req.params
  const user = await User.findByIdAndDelete(userId)
  if (!user) {
    throw new CustomError.NotFoundError("User does not exist")
  }
  res.status(StatusCodes.OK).json({ msg: "User deleted" })
}

module.exports = {
  getAllUsers,
  createUserAdmin,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserAdmin,
  updateUserPassword,
  deleteUserAdmin,
}
