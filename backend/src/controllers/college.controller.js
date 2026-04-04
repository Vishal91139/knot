import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// it return all active colleges
const getAllCollege = asyncHandler(async(req, res) => {
    const colleges = await prisma.college.findMany({
        where: {
            is_active : true
        }
    });

    if (colleges.length === 0) {
        throw new ApiError(404, "No colleges found");
    }
    
    res.status(200).json(
        new ApiResponse(200, colleges, "colleges fetched successfully")
    )
})

// it return the college by collegeId
const collegeById = asyncHandler(async(req, res) => {
    const { collegeId } = req.params

    if(!collegeId){
        throw new ApiError(400, "collegeId is required!")
    }

    const college = await prisma.college.findUnique({
        where : {
            id : collegeId
        }
    })

    if(!college){
        throw new ApiError(404, "college not found")
    }

    res.status(200).json(
        new ApiResponse(200, college, "college found!")
    )
})

// it return the college by name as query
const collegeByName = asyncHandler(async(req, res) => {
    const { query } = req.query

    if(!query){
        throw new ApiError(400, "college name is required")
    }

    const colleges = await prisma.college.findMany({
        where: {
            name: {
                contains: query,
                mode: "insensitive"
            }
        }
    });

    if(colleges.length === 0){
        throw new ApiError(404, "college not found!")
    }

    res.status(200).json(
        new ApiResponse(200, colleges, "college found")
    )
})