import { Router } from "express";
import { collegeById, collegeByName, getAllCollege } from "../controllers/college.controller.js";

const router = Router();

router.route("/").get(getAllCollege);
router.route("/search").get(collegeByName);
router.route("/:collegeId").get(collegeById);

export default router;
