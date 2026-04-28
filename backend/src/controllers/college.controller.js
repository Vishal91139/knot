import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertCollegeScopeOrSuperAdmin } from "../middlewares/role.middleware.js";
import { trim } from "../utils/sanitize.js";

const parseBoolean = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
};

const resolveCollegeId = (req) => {
    return trim(req.params.collegeId) || trim(req.body.collegeId) || trim(req.body.id);
};

// return all active colleges
const getAllCollege = asyncHandler(async(req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const q = trim(req.query.q);
    const isActive = parseBoolean(req.query.isActive);

    const where = {};

    if (q) {
        where.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { short_name: { contains: q, mode: "insensitive" } },
            { email_domain: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } },
        ];
    }

    if (isActive !== null) {
        where.is_active = isActive;
    } else {
        where.is_active = true;
    }

    const [data, total] = await prisma.$transaction([
        prisma.college.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: "desc" },
        }),
        prisma.college.count({ where }),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, "Colleges fetched successfully")
    );
});

// return the college by collegeId
const collegeById = asyncHandler(async(req, res) => {
    const collegeId = resolveCollegeId(req);

    if(!collegeId){
        throw new ApiError(400, "collegeId is required")
    }

    const college = await prisma.college.findUnique({
        where : {
            id : collegeId
        }
    })

    if(!college){
        throw new ApiError(404, "college not found")
    }

    if (req.user) {
        assertCollegeScopeOrSuperAdmin(req.user, college.id);
    }

    res.status(200).json(
        new ApiResponse(200, college, "College found")
    );
});

// return colleges by name / short name / domain as query
const collegeByName = asyncHandler(async(req, res) => {
    const query = trim(req.query.query) || trim(req.query.q)

    if(!query){
        throw new ApiError(400, "college name is required")
    }

    const colleges = await prisma.college.findMany({
        where: {
            OR: [
                {
                    name: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
                {
                    short_name: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
                {
                    email_domain: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
            ],
        },
        orderBy: { created_at: "desc" },
    });

    res.status(200).json(
        new ApiResponse(200, colleges, "Colleges fetched successfully")
    );
});

const createCollege = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.role !== "super_admin") {
        throw new ApiError(403, "Only super admin can create colleges");
    }

    const name = trim(req.body.name);
    const shortName = trim(req.body.shortName) || trim(req.body.short_name) || null;
    const emailDomain = trim(req.body.emailDomain) || trim(req.body.email_domain);
    const logoUrl = trim(req.body.logoUrl) || trim(req.body.logo_url) || null;
    const city = trim(req.body.city) || null;
    const state = trim(req.body.state) || null;
    const websiteUrl = trim(req.body.websiteUrl) || trim(req.body.website_url) || null;

    if (!name || !emailDomain) {
        throw new ApiError(400, "name and emailDomain are required");
    }

    const existing = await prisma.college.findFirst({
        where: {
            OR: [
                { name: { equals: name, mode: "insensitive" } },
                ...(shortName ? [{ short_name: { equals: shortName, mode: "insensitive" } }] : []),
                { email_domain: { equals: emailDomain, mode: "insensitive" } },
            ],
        },
        select: { id: true },
    });

    if (existing) {
        throw new ApiError(409, "College already exists with the same name, short name, or email domain");
    }

    const college = await prisma.college.create({
        data: {
            name,
            short_name: shortName,
            email_domain: emailDomain,
            logo_url: logoUrl,
            city,
            state,
            website_url: websiteUrl,
            is_active: true,
        },
    });

    return res.status(201).json(new ApiResponse(201, college, "College created successfully"));
});

const updateCollege = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const collegeId = resolveCollegeId(req);

    if (!collegeId) {
        throw new ApiError(400, "collegeId is required");
    }

    assertCollegeScopeOrSuperAdmin(req.user, collegeId);

    const existingCollege = await prisma.college.findUnique({
        where: { id: collegeId },
        select: { id: true },
    });

    if (!existingCollege) {
        throw new ApiError(404, "College not found");
    }

    const data = {};
    const name = trim(req.body.name);
    const shortName = trim(req.body.shortName) || trim(req.body.short_name);
    const emailDomain = trim(req.body.emailDomain) || trim(req.body.email_domain);
    const logoUrl = trim(req.body.logoUrl) || trim(req.body.logo_url);
    const city = trim(req.body.city);
    const state = trim(req.body.state);
    const websiteUrl = trim(req.body.websiteUrl) || trim(req.body.website_url);

    if (typeof req.body.name === "string" && name) data.name = name;
    if (typeof req.body.shortName === "string" || typeof req.body.short_name === "string") data.short_name = shortName || null;
    if (typeof req.body.emailDomain === "string" || typeof req.body.email_domain === "string") data.email_domain = emailDomain || null;
    if (typeof req.body.logoUrl === "string" || typeof req.body.logo_url === "string") data.logo_url = logoUrl || null;
    if (typeof req.body.city === "string") data.city = city || null;
    if (typeof req.body.state === "string") data.state = state || null;
    if (typeof req.body.websiteUrl === "string" || typeof req.body.website_url === "string") data.website_url = websiteUrl || null;

    if (Object.keys(data).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    const updated = await prisma.college.update({
        where: { id: collegeId },
        data,
    });

    return res.status(200).json(new ApiResponse(200, updated, "College updated successfully"));
});

const setCollegeActiveState = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.role !== "super_admin") {
        throw new ApiError(403, "Only super admin can change college active state");
    }

    const collegeId = resolveCollegeId(req);
    const isActive = parseBoolean(req.body.isActive);

    if (!collegeId) {
        throw new ApiError(400, "collegeId is required");
    }

    if (isActive === null) {
        throw new ApiError(400, "isActive must be true or false");
    }

    const college = await prisma.college.findUnique({
        where: { id: collegeId },
        select: { id: true },
    });

    if (!college) {
        throw new ApiError(404, "College not found");
    }

    const updated = await prisma.college.update({
        where: { id: collegeId },
        data: { is_active: isActive },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updated,
            isActive ? "College activated successfully" : "College deactivated successfully"
        )
    );
});

export {
    getAllCollege,
    collegeById,
    collegeByName,
    createCollege,
    updateCollege,
    setCollegeActiveState,
}