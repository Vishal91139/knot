import { Router } from "express";
import {
	collegeById,
	collegeByName,
	createCollege,
	getAllCollege,
	setCollegeActiveState,
	updateCollege,
} from "../controllers/college.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireSuperAdmin } from "../middlewares/role.middleware.js";

const router = Router();

router
	.route("/")
	.get(getAllCollege)
	.post(verifyJWT, requireSuperAdmin, createCollege);

router.route("/search").get(collegeByName);
router.route("/:collegeId").get(collegeById);
router.patch("/:collegeId", verifyJWT, requireSuperAdmin, updateCollege);
router.patch("/:collegeId/active-state", verifyJWT, requireSuperAdmin, setCollegeActiveState);

export default router;
