import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createOrganizerAcc = asyncHandler(async(req, res) => {
    const {user_id, college_id, org_name, org_type, logo_url, description} = req.body;

    if(!user_id || !college_id || !org_name || !org_type){
        throw new ApiError(400, "Neccessary fiels are required to create a Acc");
    }

    const user = await prisma.user.findFirst({
        where: { id: user_id, is_active: true }
    })
    if(!user) {
        throw new ApiError(404, "user not found!")
    }

    if (user.role !== "faculty") {
        throw new ApiError(400, "Only faculty account can be assigned as organizer user_id")
    }
    
    const college = await prisma.college.findFirst({
        where: { id: college_id, is_active: true }
    })
    if(!college) {
        throw new ApiError(404, "user not found!")
    }

    const orgAcc = await prisma.organizer.create({
        data: {
            user_id,
            college_id,
            org_name,
            org_type,
            logo_url,
            description,
            is_active: true
        }
    })
    
    return res.status(201).json(
        new ApiResponse(201, orgAcc, "Organizer account created")
    )
})

const listAllOrganizer = asyncHandler(async(req, res) => {
    const orgAcc = prisma.organizer.findMany({
        where: {college_id: req.user.college_id}
    })

    if (orgAcc.length === 0) {
        throw new ApiError(404, "No organizer found");
    }
    
    res.status(200).json(
        new ApiResponse(200, orgAcc, "Organizers fetched successfully")
    )
})

const organizerById = asyncHandler(async(req, res) => {
    const { id } = req.body;

    if(!id) {
        throw new ApiError(400, "Organizer id is required")
    }

    const orgAcc = await prisma.organizer.findFirst({
        where: { id }
    })

    if(orgAcc.length === 0){
        throw new ApiError(404, "organizer account not found!")
    }

    res.status(200).json(
        new ApiResponse(200, orgAcc, "Organizer fetched successfully")
    )
})

const organizerByName = asyncHandler(async(req, res) => {
    const { query } = req.query

    if(!query){
        throw new ApiError(400, "organizer name is required")
    }

    const orgAcc = await prisma.organizer.findMany({
        where: {
            name: {
                contains: query,
                mode: "insensitive"
            }
        }
    });

    if(orgAcc.length === 0){
        throw new ApiError(404, "organizer account not found!")
    }

    res.status(200).json(
        new ApiResponse(200, orgAcc, "Organizer fetched successfully")
    )
})

export {
    createOrganizerAcc,
    listAllOrganizer,
    organizerById,
    organizerByName,
}