import { Router } from "express";
import {
	createEvent,
	deleteEvent,
	eventById,
	getAllEvents,
	setEventFeaturedState,
	setEventStatus,
	updateEvent,
} from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ROLE, requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/").get(getAllEvents).post(verifyJWT, requireRoles("faculty", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), createEvent);
router.route("/search").get(getAllEvents);
router.route("/:eventId").get(eventById).patch(verifyJWT, requireRoles("faculty", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), updateEvent).delete(verifyJWT, requireRoles("faculty", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), deleteEvent);
router.route("/:eventId/status").patch(verifyJWT, requireRoles("faculty", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), setEventStatus);
router.route("/:eventId/feature").patch(verifyJWT, requireRoles("faculty", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), setEventFeaturedState);

export default router;
