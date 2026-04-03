import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken, hashToken, getRefreshExpiryDate } from "../utils/tokens.js";
import { refreshCookieOptions } from "../utils/cookies.js";
import bcrypt from "bcrypt";
import { trimLower } from "../utils/sanitize.js";

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
const changeCurrentPassword = asyncHandler(async(req, res) => {
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

// It returns the current user
const getCurrentUser = asyncHandler(async(req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

export {
  loginUser,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser
}