import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js";


export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const userId = decodedToken?.sub || decodedToken?.id || decodedToken?._id;
    
        if(!userId) {
            throw new ApiError(401, "Invalid Access Token payload")
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                is_active: true,
                college_id: true,
            },
        });

        if (!user || !user.is_active) {
           throw new ApiError(401, "Invalid access token");
        }
    
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
    }
})

export const requireRoles = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized request")
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, "You do not have permission to perform this action")
        }

        next()
    }
}

export const requireCollegeScope = (getCollegeId) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized request")
        }

        if (req.user.role === "super_admin") {
            return next()
        }

        const targetCollegeId = typeof getCollegeId === "function"
            ? getCollegeId(req)
            : (req.params?.collegeId || req.body?.collegeId || req.body?.college_id)

        if (!targetCollegeId) {
            throw new ApiError(400, "Target college id is required for scope check")
        }

        if (req.user.role !== "college_admin") {
            throw new ApiError(403, "Only college admins can perform this action")
        }

        if (String(req.user.college_id) !== String(targetCollegeId)) {
            throw new ApiError(403, "You can only manage resources for your own college")
        }

        next()
    }
}

