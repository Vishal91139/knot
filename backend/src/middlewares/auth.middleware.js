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
                college_email: true,
                role: true,
                college_id: true,
                roll_number: true,
                branch: true,
                year_of_study: true,
                avatar_url: true,
                is_verified: true,
                is_active: true,
            },
        });

        if (!user) {
           throw new ApiError(401, "Invalid access token");
        }

        if (!user.is_active) {
           throw new ApiError(403, "Account is inactive");
        }
    
        req.user = user;
        next()

    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }
        throw new ApiError(401, error?.message || "Invalid access Token")
    }
})

