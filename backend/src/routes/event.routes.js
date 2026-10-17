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
import {
	getMyEventRegistration,
	registerForEvent,
	unregisterForEvent,
} from "../controllers/registration.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ROLE, requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/").get(getAllEvents).post(verifyJWT, requireRoles("faculty", "organizer", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), createEvent);
router.route("/search").get(getAllEvents);
router
	.route("/:eventId/register")
	.post(verifyJWT, requireRoles("student"), registerForEvent)
	.delete(verifyJWT, requireRoles("student"), unregisterForEvent);
router
	.route("/:eventId/registration")
	.get(verifyJWT, requireRoles("student"), getMyEventRegistration);
router.route("/:eventId").get(eventById).patch(verifyJWT, requireRoles("faculty", "organizer", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), updateEvent).delete(verifyJWT, requireRoles("faculty", "organizer", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), deleteEvent);
router.route("/:eventId/status").patch(verifyJWT, requireRoles("faculty", "organizer", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), setEventStatus);
router.route("/:eventId/feature").patch(verifyJWT, requireRoles("faculty", "organizer", ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN), setEventFeaturedState);

export default router;
