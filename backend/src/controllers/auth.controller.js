import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isInRange, trim, trimLower } from "../utils/sanitize.js";
import { generateAccessToken, generateRefreshToken, hashToken, getRefreshExpiryDate } from "../utils/tokens.js";
import { refreshCookieOptions } from "../utils/cookies.js";
import bcrypt from "bcrypt";

// it will extract the domain name of college email
const getDomainFromEmail = (value) => {
  if (!value) return null
  const atIndex = value.lastIndexOf("@")
  if (atIndex === -1 || atIndex === value.length - 1) return null
  return value.slice(atIndex + 1).toLowerCase()
}

// it will register the student and faculty on the platform
const registerUser = asyncHandler(async (req, res) => {
  const fullName = trim(req.body.fullName)
  const email = trimLower(req.body.email)
  const collegeEmail = trimLower(req.body.collegeEmail)
  const password = typeof req.body.password === "string" ? req.body.password : ""
  const requestedRole = trimLower(req.body.role || "student")
  const collegeId = trim(req.body.collegeId) || null
  const rollNumber = trim(req.body.rollNumber)
  const branch = trim(req.body.branch)
  const yearOfStudy = req.body.yearOfStudy

  const allowedPublicRoles = new Set(["student", "faculty"])

  // Neccessary inputs are required
  if (!fullName || !email || !password) {
    throw new ApiError(400, "Necessary fields are required")
  }

  if (!allowedPublicRoles.has(requestedRole)) {
    throw new ApiError(403, "Public signup allows only student or faculty")
  }

  if (requestedRole === "faculty" && !collegeId) {
    throw new ApiError(400, "collegeId is required for faculty signup")
  }

  // if role is student then student fields are neccessary
  // if (requestedRole === "student") {
  //   if (!rollNumber || !branch || !isInRange(yearOfStudy, 1, 8)) {
  //     throw new ApiError(400, "Student must have valid rollNumber, branch, yearOfStudy")
  //   }
  // }

  if (requestedRole === "faculty" && !collegeEmail) {
    throw new ApiError(400, "collegeEmail is required for faculty signup")
  }

  if (collegeEmail && !collegeId) {
    throw new ApiError(400, "collegeId is required when providing collegeEmail")
  }

  // checking if given college is present and active in our db
  let college = null
  if (collegeId) {
    college = await prisma.college.findFirst({
      where: {
        id: collegeId,
        is_active: true,
      }
    })
    if (!college) {
      throw new ApiError(404, "College not found")
    }
  }

  // checking if college email is valid and matches to the college
  if (collegeEmail && college) {
    const emailDomain = getDomainFromEmail(collegeEmail)
    if (!emailDomain) {
      throw new ApiError(400, "Invalid collegeEmail format")
    }

    if (emailDomain !== String(college.email_domain).toLowerCase()) {
      throw new ApiError(400, "collegeEmail domain must match college email domain")
    }
  }

  // checking if the user already registered on our platform (By personal email or student email)
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists")
  }

  // if user uploads avatar Image then upload on cloudinary
  const avatarLocalPath = req.files?.avatar?.[0]?.path
  let avatarUrl = null;

  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) throw new ApiError(400, "Cloudinary upload failed");
    avatarUrl = avatar.url;
  }

  // passwordHashing
  const hashedPassword = await bcrypt.hash(password, 10)

  // creating user and returning
  const user = await prisma.user.create({
    data: {
      full_name: fullName,
      email,
      college_email: collegeEmail || null,
      password_hash: hashedPassword,
      role: requestedRole,
      college_id: collegeId,
      roll_number: requestedRole === "student" ? rollNumber : null,
      branch: requestedRole === "student" ? branch : null,
      year_of_study: requestedRole === "student" ? Number(yearOfStudy) : null,
      avatar_url: avatarUrl,
      is_verified: false,
      verification_method: null,
      is_active: true
    },
    select: {
      full_name: true,
      email: true,
      college_email: true,
      role: true,
      college_id: true,
      roll_number: true,
      branch: true,
      year_of_study: true,
      is_active: true,
      is_verified: true
    }
  })

  return res.status(201).json(
    new ApiResponse(201, user, "User registered successfully")
  )
})

// This function logins the user and return email,name,id,role
const loginUser = asyncHandler(async(req, res) => {
  const email = trimLower(req.body.email)
  const password = typeof req.body.password === "string" ? req.body.password : ""

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required")
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new ApiError(401, "Invalid credentials")

  if (!user.is_active) {
    throw new ApiError(403, "User account is inactive")
  }

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) throw new ApiError(401, "Invalid credentials")

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() }
  })

  const accessToken = generateAccessToken(user)
  const rawRefreshToken = generateRefreshToken()
  const refreshTokenHash = hashToken(rawRefreshToken)

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: getRefreshExpiryDate(),
      ip_address: req.ip || null,
      user_agent: req.get("user-agent") || null,
    },
  })

  res
    .cookie("refreshToken", rawRefreshToken, refreshCookieOptions)
    .cookie("accessToken", accessToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
        },
        "User logged in successfully"
      )
    )
})

// This function logout
const logout = asyncHandler(async(req, res) => {
  const rawToken = req.cookies?.refreshToken

  if (rawToken) {
    const tokenHash = hashToken(rawToken)
    await prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    })
  }

  res.clearCookie("refreshToken", refreshCookieOptions)
  return res.json(new ApiResponse(200, {}, "User logged out successfully"))
})

// This function generates the refreshToken
const refreshAccessToken = asyncHandler(async(req, res) => {
  const oldRawToken = req.cookies?.refreshToken
  if (!oldRawToken) throw new ApiError(401, "No refresh token provided")

  const oldHash = hashToken(oldRawToken)

  const existing = await prisma.refreshToken.findUnique({
    where: { token_hash: oldHash },
    include: { user: true },
  })

  if (!existing || existing.revoked_at || new Date(existing.expires_at) < new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token")
  }

  if (!existing.user || !existing.user.is_active) {
    throw new ApiError(403, "User account is inactive")
  }

  const newRawToken = generateRefreshToken()
  const newHash = hashToken(newRawToken)

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { token_hash: oldHash },
      data: {
        revoked_at: new Date(),
        replaced_by_token_hash: newHash,
      },
    }),
    prisma.refreshToken.create({
      data: {
        user_id: existing.user_id,
        token_hash: newHash,
        expires_at: getRefreshExpiryDate(),
        ip_address: req.ip || null,
        user_agent: req.get("user-agent") || null,
      },
    }),
  ])

  const accessToken = generateAccessToken(existing.user)

  res
    .cookie("refreshToken", newRawToken, refreshCookieOptions)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"))
})

// This function change the users password by oldPassword
const resetPassword = asyncHandler(async(req, res) => {
  const oldPassword = typeof req.body.oldPassword === "string" ? req.body.oldPassword : ""
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : ""

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required")
  }

  const userId = req.user?.id
  if (!userId) {
    throw new ApiError(401, "Unauthorized request")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password_hash: true }
  })

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password_hash)
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: newPasswordHash }
  })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const forgetPassword = asyncHandler(async(req, res) => {})

const verifyEmail = asyncHandler(async(req, res) => {})

export {
  registerUser,
  loginUser,
  logout,
  refreshAccessToken,
  resetPassword,
}