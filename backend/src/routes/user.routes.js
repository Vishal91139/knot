import { Router } from "express";
import { getAllUsers, getCurrentUser, getUserById, getUsersByCollege, toggleUserStatus, updateAvatar, updateUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireCollegeAdminOrSuperAdmin } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/profile").get(verifyJWT, getCurrentUser)
router.route("/:userId/profile").get(verifyJWT, getUserById)
router.route("/").get(verifyJWT, requireCollegeAdminOrSuperAdmin, getAllUsers)
router.route("/:collegeId/users").get(verifyJWT, requireCollegeAdminOrSuperAdmin, getUsersByCollege)

router.route("/update").patch(verifyJWT, updateUser)
router.route("/avatar").patch(upload.single("avatar"), updateAvatar)
router.route("/toggle-status").patch(verifyJWT, requireCollegeAdminOrSuperAdmin, toggleUserStatus)

export default router;