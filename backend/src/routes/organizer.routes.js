import { Router } from "express";
import {
	createOrganizerAcc,
	listAllOrganizer,
	organizerById,
	organizerByName,
} from "../controllers/organizer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireCollegeAdminOrSuperAdmin } from "../middlewares/role.middleware.js";

const router = Router();

router
	.route("/")
	.post(verifyJWT, requireCollegeAdminOrSuperAdmin(), createOrganizerAcc)
	.get(verifyJWT, requireCollegeAdminOrSuperAdmin(), listAllOrganizer);

router.route("/search").get(verifyJWT, requireCollegeAdminOrSuperAdmin(), organizerByName);
router.route("/by-id").post(verifyJWT, requireCollegeAdminOrSuperAdmin(), organizerById);

export default router;
