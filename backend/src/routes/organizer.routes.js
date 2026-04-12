import { Router } from "express";
import {
	createOrganizerAcc,
	listAllOrganizer,
	organizerById,
	organizerByName,
	setOrganizerActiveState,
	updateOrganizer,
} from "../controllers/organizer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireCollegeAdminOrSuperAdmin } from "../middlewares/role.middleware.js";

const router = Router();

router
	.route("/")
	.post(verifyJWT, requireCollegeAdminOrSuperAdmin, createOrganizerAcc)
	.get(verifyJWT, requireCollegeAdminOrSuperAdmin, listAllOrganizer);

router.route("/search").get(verifyJWT, requireCollegeAdminOrSuperAdmin, organizerByName);
router.route("/by-id").post(verifyJWT, requireCollegeAdminOrSuperAdmin, organizerById);
router.route("/:organizerId").get(verifyJWT, requireCollegeAdminOrSuperAdmin, organizerById);
router.route("/:organizerId").patch(verifyJWT, requireCollegeAdminOrSuperAdmin, updateOrganizer);
router.route("/:organizerId/active-state").patch(verifyJWT, requireCollegeAdminOrSuperAdmin, setOrganizerActiveState);

export default router;
