import { Router } from "express";
import {
	approveCollegeAdminRequest,
	assignRole,
	listCollegeAdminRequests,
	rejectCollegeAdminRequest,
	setUserActiveState,
	submitCollegeAdminRequest,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireCollegeAdminOrSuperAdmin, requireSuperAdmin } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/college-admin-requests").post(submitCollegeAdminRequest)

router.get(
	"/college-admin-requests",
	verifyJWT,
	requireCollegeAdminOrSuperAdmin,
	listCollegeAdminRequests
);

router.post(
	"/college-admin-requests/:requestId/approve",
	verifyJWT,
	requireSuperAdmin,
	approveCollegeAdminRequest
);

router.post(
	"/college-admin-requests/:requestId/reject",
	verifyJWT,
	requireSuperAdmin,
	rejectCollegeAdminRequest
);

router.patch(
	"/users/:userId/active-state",
	verifyJWT,
	requireCollegeAdminOrSuperAdmin,
	setUserActiveState
);

router.patch(
	"/users/:userId/role",
	verifyJWT,
	requireSuperAdmin,
	assignRole
);

export default router;
