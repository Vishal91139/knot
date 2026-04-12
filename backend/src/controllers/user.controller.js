import prisma from "../config/prisma.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { isInRange, trim, trimLower } from "../utils/sanitize.js"

// It returns the current user
const getCurrentUser = asyncHandler(async(req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const getUserById = asyncHandler(async(req, res) => {
  const id = trim(req.params.userId)

  if(!id) {
    throw new ApiError(400, "userId is required")
  }

  const user = await prisma.user.findFirst({
    where: { 
      id, 
      is_active: true 
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      college_email: true,
      role: true,
      college_id: true,
      roll_number: true,
      branch: true,
      year_of_study: true,
      avatar_url: true,
      is_verified: true,
      is_active: true,
    }
  })

  if(!user){
    throw new ApiError(404, "user not found")
  }

  return res.status(200).json(
    new ApiResponse(200, user, "user fetched successfully")
  )
})

const getAllUsers = asyncHandler(async(req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request")
  }

  const role = typeof req.query.role === "string" ? trimLower(req.query.role) : null
  const collegeId = trim(req.query.collegeId)
  const q = typeof req.query.q === "string" ? trim(req.query.q) : null
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const isActiveQuery = req.query.isActive

  const where = {}

  if (req.user.role === "college_admin") {
    where.college_id = req.user.college_id
  } else if (req.user.role !== "super_admin") {
    throw new ApiError(403, "Only college admin or super admin can view users")
  }

  if (role) where.role = role
  if (collegeId && req.user.role === "super_admin") where.college_id = collegeId

  if (isActiveQuery === "true") where.is_active = true
  if (isActiveQuery === "false") where.is_active = false

  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { college_email: { contains: q, mode: "insensitive" } },
    ]
  }

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        college_email: true,
        role: true,
        college_id: true,
        roll_number: true,
        branch: true,
        year_of_study: true,
        avatar_url: true,
        is_verified: true,
        is_active: true,
        created_at: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Users fetched successfully"
    )
  )
})

const updateUser = asyncHandler(async(req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized request")
  }

  const fullName = trim(req.body.fullName)
  const collegeEmail = typeof req.body.collegeEmail === "string" ? trimLower(req.body.collegeEmail) : null
  const branch = trim(req.body.branch)
  const rollNumber = trim(req.body.rollNumber)
  const yearOfStudy = req.body.yearOfStudy

  const data = {}

  if (fullName) data.full_name = fullName
  if (typeof req.body.collegeEmail === "string") data.college_email = collegeEmail || null

  if (req.user.role === "student") {
    if (branch) data.branch = branch
    if (rollNumber) data.roll_number = rollNumber
    if (yearOfStudy !== undefined) {
      if (!isInRange(yearOfStudy, 1, 8)) {
        throw new ApiError(400, "yearOfStudy must be between 1 and 8")
      }
      data.year_of_study = Number(yearOfStudy)
    }
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No valid fields provided for update")
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true,
      full_name: true,
      email: true,
      college_email: true,
      role: true,
      college_id: true,
      roll_number: true,
      branch: true,
      year_of_study: true,
      avatar_url: true,
      is_verified: true,
      is_active: true,
      updated_at: true,
    },
  })

  return res.status(200).json(new ApiResponse(200, updated, "User updated successfully"))
})

const updateAvatar = asyncHandler(async(req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized request")
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar) {
    throw new ApiError(400, "Cloudinary upload failed")
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar_url: avatar.url },
    select: {
      id: true,
      full_name: true,
      avatar_url: true,
      updated_at: true,
    },
  })

  return res.status(200).json(new ApiResponse(200, updated, "Avatar updated successfully"))
})

const toggleUserStatus = asyncHandler(async(req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request")
  }

  const userId = trim(req.params.userId) || trim(req.body.userId)
  const isActive = req.body.isActive === true || req.body.isActive === "true"

  if (!userId) {
    throw new ApiError(400, "userId is required")
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      college_id: true,
      is_active: true,
    },
  })

  if (!target) {
    throw new ApiError(404, "User not found")
  }

  if (target.role === "super_admin") {
    throw new ApiError(403, "Super admin account state cannot be changed")
  }

  if (req.user.role === "college_admin") {
    if (String(req.user.college_id) !== String(target.college_id)) {
      throw new ApiError(403, "You can only manage users from your own college")
    }
  } else if (req.user.role !== "super_admin") {
    throw new ApiError(403, "Only college admin or super admin can perform this action")
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { is_active: isActive },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      college_id: true,
      is_active: true,
      updated_at: true,
    },
  })

  return res.status(200).json(
    new ApiResponse(200, updated, isActive ? "User activated successfully" : "User deactivated successfully")
  )
})

const getUsersByCollege = asyncHandler(async(req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request")
  }

  const collegeId = trim(req.params.collegeId) || trim(req.query.collegeId)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)

  if (!collegeId) {
    throw new ApiError(400, "collegeId is required")
  }

  if (req.user.role === "college_admin" && String(req.user.college_id) !== String(collegeId)) {
    throw new ApiError(403, "You can only view users from your own college")
  }

  if (!["college_admin", "super_admin"].includes(req.user.role)) {
    throw new ApiError(403, "Only college admin or super admin can view users by college")
  }

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: { college_id: collegeId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        college_email: true,
        role: true,
        college_id: true,
        roll_number: true,
        branch: true,
        year_of_study: true,
        avatar_url: true,
        is_verified: true,
        is_active: true,
        created_at: true,
      },
    }),
    prisma.user.count({ where: { college_id: collegeId } }),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "College users fetched successfully"
    )
  )
})


export {
  getCurrentUser,
  getUserById,
  getAllUsers,
  updateUser,
  updateAvatar,
  toggleUserStatus,
  getUsersByCollege,
}