import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertCollegeScopeOrSuperAdmin } from "../middlewares/role.middleware.js";
import { trim, trimLower } from "../utils/sanitize.js";

const ALLOWED_ORG_TYPES = new Set(["club", "department"]);

const parseBoolean = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
};

const resolveOrganizerId = (req) => {
    return (
        trim(req.params.organizerId) ||
        trim(req.body.organizerId) ||
        trim(req.body.id)
    );
};

const normalizeOrgType = (value) => {
    const orgType = trimLower(value);
    if (!orgType) return null;

    if (!ALLOWED_ORG_TYPES.has(orgType)) {
        throw new ApiError(400, "org_type must be either club or department");
    }

    return orgType;
};

const createOrganizerAcc = asyncHandler(async(req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const userId = trim(req.body.userId);
    const orgName = trim(req.body.orgName);
    const orgType = normalizeOrgType(req.body.orgType);
    const logoUrl = trim(req.body.logoUrl) || null;
    const description = trim(req.body.description) || null;
    const collegeId = req.user?.college_id;

    assertCollegeScopeOrSuperAdmin(req.user, collegeId);

    if (!userId || !collegeId || !orgName || !orgType) {
        throw new ApiError(400, "userId, orgName, orgType and a valid college scope are required");
    }

    const [user, college, existingOrganizer] = await prisma.$transaction([
        prisma.user.findFirst({
            where: {
                id: userId,
                is_active: true,
            },
            select: {
                id: true,
                role: true,
                college_id: true,
            },
        }),
        prisma.college.findFirst({
            where: {
                id: collegeId,
                is_active: true,
            },
            select: {
                id: true,
            },
        }),
        prisma.organizer.findUnique({
            where: { user_id: userId },
            select: {
                id: true,
                is_active: true,
            },
        }),
    ]);

    if (!user) {
        throw new ApiError(404, "User not found or inactive");
    }

    if (user.role !== "faculty") {
        throw new ApiError(400, "Only faculty account can be assigned as organizer userId");
    }

    if (String(user.college_id) !== String(collegeId)) {
        throw new ApiError(400, "Faculty should belong to the same college");
    }

    if (!college) {
        throw new ApiError(404, "College not found or inactive");
    }

    if (existingOrganizer) {
        throw new ApiError(409, "Organizer account already exists for this faculty user");
    }

    const orgAcc = await prisma.organizer.create({
        data: {
            user_id: userId,
            college_id: collegeId,
            org_name: orgName,
            org_type: orgType,
            logo_url: logoUrl,
            description,
            is_active: true,
        },
    });
    
    return res.status(201).json(
        new ApiResponse(201, orgAcc, "Organizer account created")
    );
});

const listAllOrganizer = asyncHandler(async(req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const q = trim(req.query.q);
    const requestedCollegeId = trim(req.query.collegeId);
    const orgType = normalizeOrgType(req.query.orgType);
    const isActive = parseBoolean(req.query.isActive);

    const where = {};

    if (req.user.role === "college_admin") {
        where.college_id = req.user.college_id;
    } else if (req.user.role === "super_admin") {
        if (requestedCollegeId) {
            where.college_id = requestedCollegeId;
        }
    } else {
        throw new ApiError(403, "Only college admin or super admin can view organizers");
    }

    if (orgType) {
        where.org_type = orgType;
    }

    if (isActive !== null) {
        where.is_active = isActive;
    }

    if (q) {
        where.OR = [
            { org_name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await prisma.$transaction([
        prisma.organizer.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: "desc" },
        }),
        prisma.organizer.count({ where }),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, "Organizers fetched successfully")
    );
});

const organizerById = asyncHandler(async(req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const organizerId = resolveOrganizerId(req);

    if(!organizerId) {
        throw new ApiError(400, "Organizer id is required")
    }

    const orgAcc = await prisma.organizer.findUnique({
        where: { id: organizerId },
    });

    if(!orgAcc){
        throw new ApiError(404, "Organizer account not found")
    }

    assertCollegeScopeOrSuperAdmin(req.user, orgAcc.college_id);

    res.status(200).json(
        new ApiResponse(200, orgAcc, "Organizer fetched successfully")
    );
});

const organizerByName = asyncHandler(async(req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const query = trim(req.query.query) || trim(req.query.q);
    const requestedCollegeId = trim(req.query.collegeId);

    if(!query){
        throw new ApiError(400, "organizer name is required")
    }

    const where = {
        org_name: {
            contains: query,
            mode: "insensitive",
        },
    };

    if (req.user.role === "college_admin") {
        where.college_id = req.user.college_id;
    } else if (req.user.role === "super_admin") {
        if (requestedCollegeId) {
            where.college_id = requestedCollegeId;
        }
    } else {
        throw new ApiError(403, "Only college admin or super admin can search organizers");
    }

    const orgAcc = await prisma.organizer.findMany({
        where,
        orderBy: { created_at: "desc" },
    });

    res.status(200).json(
        new ApiResponse(200, orgAcc, "Organizer fetched successfully")
    );
});

const getMyOrganizer = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const organizer = await prisma.organizer.findFirst({
        where: {
            user_id: req.user.id,
            is_active: true,
        },
    });

    if (!organizer) {
        throw new ApiError(404, "Organizer account not found");
    }

    return res.status(200).json(
        new ApiResponse(200, organizer, "Organizer fetched successfully")
    );
});

const updateOrganizer = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const organizerId = resolveOrganizerId(req);

    if (!organizerId) {
        throw new ApiError(400, "Organizer id is required");
    }

    const existingOrganizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
        select: {
            id: true,
            college_id: true,
        },
    });

    if (!existingOrganizer) {
        throw new ApiError(404, "Organizer account not found");
    }

    assertCollegeScopeOrSuperAdmin(req.user, existingOrganizer.college_id);

    const orgName = trim(req.body.orgName) || trim(req.body.org_name);
    const orgType = normalizeOrgType(req.body.orgType ?? req.body.org_type);
    const logoUrl = trim(req.body.logoUrl) || trim(req.body.logo_url);
    const description = trim(req.body.description);
    const userId = trim(req.body.userId) || trim(req.body.user_id);

    const data = {};

    if (orgName) data.org_name = orgName;
    if (orgType) data.org_type = orgType;
    if (typeof req.body.logoUrl === "string" || typeof req.body.logo_url === "string") {
        data.logo_url = logoUrl || null;
    }
    if (typeof req.body.description === "string") {
        data.description = description || null;
    }

    if (userId) {
        const [user, conflict] = await prisma.$transaction([
            prisma.user.findFirst({
                where: {
                    id: userId,
                    is_active: true,
                },
                select: {
                    id: true,
                    role: true,
                    college_id: true,
                },
            }),
            prisma.organizer.findFirst({
                where: {
                    user_id: userId,
                    id: {
                        not: organizerId,
                    },
                },
                select: {
                    id: true,
                },
            }),
        ]);

        if (!user) {
            throw new ApiError(404, "User not found or inactive");
        }

        if (user.role !== "faculty") {
            throw new ApiError(400, "Only faculty account can be assigned as organizer userId");
        }

        if (String(user.college_id) !== String(existingOrganizer.college_id)) {
            throw new ApiError(400, "Faculty should belong to the same college");
        }

        if (conflict) {
            throw new ApiError(409, "Another organizer already uses this faculty user");
        }

        data.user_id = userId;
    }

    if (Object.keys(data).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    const updated = await prisma.organizer.update({
        where: { id: organizerId },
        data,
    });

    return res.status(200).json(
        new ApiResponse(200, updated, "Organizer updated successfully")
    );
});

const setOrganizerActiveState = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const organizerId = resolveOrganizerId(req);
    const isActive = parseBoolean(req.body.isActive);

    if (!organizerId) {
        throw new ApiError(400, "Organizer id is required");
    }

    if (isActive === null) {
        throw new ApiError(400, "isActive must be true or false");
    }

    const existingOrganizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
        select: {
            id: true,
            college_id: true,
        },
    });

    if (!existingOrganizer) {
        throw new ApiError(404, "Organizer account not found");
    }

    assertCollegeScopeOrSuperAdmin(req.user, existingOrganizer.college_id);

    const updated = await prisma.organizer.update({
        where: { id: organizerId },
        data: {
            is_active: isActive,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updated,
            isActive ? "Organizer activated successfully" : "Organizer deactivated successfully"
        )
    );
});

export {
    getMyOrganizer,
    createOrganizerAcc,
    listAllOrganizer,
    organizerById,
    organizerByName,
    updateOrganizer,
    setOrganizerActiveState,
};