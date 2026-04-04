import prisma from "../config/prisma.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { trim, trimLower, isInRange } from "../utils/sanitize.js"
import bcrypt from "bcrypt"

// it will extract the domain name of college email
const getDomainFromEmail = (value) => {
  if (!value) return null
  const atIndex = value.lastIndexOf("@")
  if (atIndex === -1 || atIndex === value.length - 1) return null
  return value.slice(atIndex + 1).toLowerCase()
}

// it will register the student on the platform
const createUser = asyncHandler(async (req, res) => {
  const fullName = trim(req.body.fullName)
  const email = trimLower(req.body.email)
  const collegeEmail = trimLower(req.body.collegeEmail)
  const password = typeof req.body.password === "string" ? req.body.password : ""
  const role = trimLower(req.body.role || "student")
  const collegeId = trim(req.body.collegeId)
  const rollNumber = trim(req.body.rollNumber)
  const branch = trim(req.body.branch)
  const yearOfStudy = req.body.yearOfStudy
  const avatarUrl = typeof req.body.avatarUrl === "string" ? trim(req.body.avatarUrl) : null

  // Neccessary inputs are required
  if (!fullName || !email || !password || !collegeId) {
    throw new ApiError(400, "Necessary fields are required")
  }

  if (role && role !== "student") {
    throw new ApiError(403, "Public signup can only create student accounts")
  }

  if (!rollNumber || !branch || !isInRange(yearOfStudy, 1, 8)) {
    throw new ApiError(400, "Student must have valid rollNumber, branch, yearOfStudy")
  }

  // checking if given college is present and active in our db
  const college = await prisma.college.findFirst({
    where: {
      id: collegeId,
      is_active: true,
    },
  })

  if (!college) {
    throw new ApiError(404, "College not found")
  }

  // checking if college email is valid and matches to the college
  if (collegeEmail) {
    const emailDomain = getDomainFromEmail(collegeEmail)
    if (!emailDomain) {
      throw new ApiError(400, "Invalid collegeEmail format")
    }

    if (emailDomain !== String(college.email_domain).toLowerCase()) {
      throw new ApiError(400, "collegeEmail domain must match college email domain")
    }
  }

  // checking if the user already registered on our platform(By email)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new ApiError(409, "User already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      full_name: fullName,
      email,
      college_email: collegeEmail || null,
      password_hash: hashedPassword,
      role: "student",
      college_id: collegeId,
      roll_number: rollNumber,
      branch,
      year_of_study: Number(yearOfStudy),
      avatar_url: avatarUrl,
      is_verified: false,
      verification_method: null,
    },
  })

  // returning user without password
  const { password_hash, ...safeUser } = user

  return res.status(201).json(
    new ApiResponse(201, safeUser, "User registered successfully")
  )
})

export {
  createUser,
}