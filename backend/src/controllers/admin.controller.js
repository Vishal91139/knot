import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertCollegeScopeOrSuperAdmin } from "../middlewares/role.middleware.js";
import { trim, trimLower } from "../utils/sanitize.js";
import bcrypt from "bcrypt";

// submit college-admin request to create acc(does not create acc until super-admin passes)
const submitCollegeAdminRequest = asyncHandler(async (req, res) => {
  const fullName = trim(req.body.fullName);
  const email = trimLower(req.body.email);
  const collegeName = trim(req.body.collegeName);
  const collegeShortName = trim(req.body.collegeShortName) || null;
  const collegeEmailDomain = trimLower(req.body.collegeEmailDomain);
  const collegeCity = trim(req.body.collegeCity) || null;
  const collegeState = trim(req.body.collegeState) || null;
  const collegeWebsiteUrl = trim(req.body.collegeWebsiteUrl) || null;
  const collegeLogoUrl = trim(req.body.collegeLogoUrl) || null;
  const phone = trim(req.body.phone) || null;
  const designation = trim(req.body.designation) || null;
  const reason = trim(req.body.reason) || null;

  if (!fullName || !email) {
    throw new ApiError(400, "fullName and email are required");
  }

  if (!collegeName || !collegeEmailDomain) {
    throw new ApiError(400, "collegeName and collegeEmailDomain are required");
  }

  const existingCollege = await prisma.college.findUnique({
    where: { email_domain: collegeEmailDomain },
    select: { id: true },
  });

  if (existingCollege) {
    throw new ApiError(409, "A college already exists with this email domain");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const existingPending = await prisma.collegeAdminRequest.findFirst({
    where: {
      email,
      status: "pending",
    },
    select: { id: true },
  });

  if (existingPending) {
    throw new ApiError(409, "A pending request already exists for this email");
  }

  const request = await prisma.collegeAdminRequest.create({
    data: {
      full_name: fullName,
      email,
      requested_college_name: collegeName,
      requested_college_short_name: collegeShortName,
      requested_college_email_domain: collegeEmailDomain,
      requested_college_city: collegeCity,
      requested_college_state: collegeState,
      requested_college_website_url: collegeWebsiteUrl,
      requested_college_logo_url: collegeLogoUrl,
      phone,
      designation,
      reason,
      status: "pending",
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, request, "College admin request submitted"));
});

// list all college admin acc creation request(for super admin)
// and college admin can see their only own request
const listCollegeAdminRequests = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const status = trimLower(req.query.status);
  const collegeEmailDomain = trimLower(req.query.collegeEmailDomain);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const where = {};

  if (status) {
    const allowed = new Set(["pending", "approved", "rejected"]);
    if (!allowed.has(status)) {
      throw new ApiError(400, "Invalid status filter");
    }
    where.status = status;
  }

  if (req.user.role === "college_admin") {
    where.email = req.user.email;
  } else if (req.user.role === "super_admin") {
    if (collegeEmailDomain) where.requested_college_email_domain = collegeEmailDomain;
  } else {
    throw new ApiError(403, "Only college admin or super admin can view requests");
  }

  const [items, total] = await prisma.$transaction([
    prisma.collegeAdminRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.collegeAdminRequest.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, "College admin requests fetched")
  );
});

// approve pending request and create real college-admin user
const approveCollegeAdminRequest = asyncHandler(async (req, res) => {
  const requestId = trim(req.params.requestId);
  const initialPassword = typeof req.body.initialPassword === "string" ? req.body.initialPassword : "";

  if (!requestId) {
    throw new ApiError(400, "requestId is required");
  }

  if (!initialPassword || initialPassword.length < 8) {
    throw new ApiError(400, "initialPassword is required and must be at least 8 characters");
  }

  const request = await prisma.collegeAdminRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be approved");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: request.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists for this email");
  }

  const passwordHash = await bcrypt.hash(initialPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    if (!request.requested_college_name || !request.requested_college_email_domain) {
      throw new ApiError(400, "Requested college details are incomplete");
    }

    const existingCollege = await tx.college.findUnique({
      where: { email_domain: request.requested_college_email_domain },
      select: { id: true },
    });

    if (existingCollege) {
      throw new ApiError(409, "A college already exists with this email domain");
    }

    const createdCollege = await tx.college.create({
      data: {
        name: request.requested_college_name,
        short_name: request.requested_college_short_name,
        email_domain: request.requested_college_email_domain,
        city: request.requested_college_city,
        state: request.requested_college_state,
        website_url: request.requested_college_website_url,
        logo_url: request.requested_college_logo_url,
        is_active: true,
      },
      select: { id: true },
    });

    const collegeId = createdCollege.id;

    const createdUser = await tx.user.create({
      data: {
        full_name: request.full_name,
        email: request.email,
        password_hash: passwordHash,
        role: "college_admin",
        college_id: collegeId,
        is_verified: true,
        verification_method: "manual",
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        college_id: true,
        is_verified: true,
        is_active: true,
        created_at: true,
      },
    });

    const updatedRequest = await tx.collegeAdminRequest.update({
      where: { id: request.id },
      data: {
        status: "approved",
        reviewed_by: req.user.id,
        reviewed_at: new Date(),
      },
    });

    return { createdUser, updatedRequest };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: result.createdUser,
        request: result.updatedRequest,
      },
      "College admin request approved and account created"
    )
  );
});

// reject pending request for college-admin acc creation(by super admin)
const rejectCollegeAdminRequest = asyncHandler(async (req, res) => {
  const requestId = trim(req.params.requestId);
  const rejectionReason = trim(req.body.rejectionReason);

  if (!requestId) {
    throw new ApiError(400, "requestId is required");
  }

  if (!rejectionReason) {
    throw new ApiError(400, "rejectionReason is required");
  }

  const request = await prisma.collegeAdminRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be rejected");
  }

  const updated = await prisma.collegeAdminRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      rejection_reason: rejectionReason,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "College admin request rejected"));
});

// Activate/deactivate user account
// super_admin: any non-super-admin account
// college_admin: only users in same college, with restrictions
const setUserActiveState = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const targetUserId = trim(req.params.userId);
  const isActive = req.body.isActive === true || req.body.isActive === "true";

  if (!targetUserId) {
    throw new ApiError(400, "userId is required");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      college_id: true,
      is_active: true,
    },
  });

  if (!target) {
    throw new ApiError(404, "Target user not found");
  }

  if (target.role === "super_admin") {
    throw new ApiError(403, "Super admin account state cannot be changed");
  }

  if (req.user.role === "college_admin") {
    assertCollegeScopeOrSuperAdmin(req.user, target.college_id);

    if (target.role === "college_admin") {
      throw new ApiError(403, "College admin cannot change another college admin state");
    }
  } else if (req.user.role !== "super_admin") {
    throw new ApiError(403, "Only college admin or super admin can perform this action");
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
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
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      updated,
      isActive ? "User activated successfully" : "User deactivated successfully"
    )
  );
});

// assign role to the user - accesed only by super admin
const assignRole = asyncHandler(async (req, res) => {
  const targetUserId = trim(req.params.userId);
  const role = trimLower(req.body.role);
  const collegeId = trim(req.body.collegeId) || null;

  const allowedRoles = new Set(["student", "organizer", "faculty", "college_admin"]);
  if (!allowedRoles.has(role)) {
    throw new ApiError(400, "Invalid role. Allowed: student, organizer, faculty, college_admin");
  }

  if (!targetUserId) {
    throw new ApiError(400, "userId is required");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, college_id: true },
  });

  if (!target) {
    throw new ApiError(404, "Target user not found");
  }

  if (target.role === "super_admin") {
    throw new ApiError(403, "Super admin role cannot be changed");
  }

  if (role === "college_admin" && !collegeId) {
    throw new ApiError(400, "collegeId is required when assigning college_admin role");
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      role,
      college_id: role === "college_admin" ? collegeId : target.college_id,
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      college_id: true,
      updated_at: true,
    },
  });

  return res.status(200).json(new ApiResponse(200, updated, "User role updated successfully"));
});

export {
  submitCollegeAdminRequest,
  listCollegeAdminRequests,
  approveCollegeAdminRequest,
  rejectCollegeAdminRequest,
  setUserActiveState,
  assignRole,
};