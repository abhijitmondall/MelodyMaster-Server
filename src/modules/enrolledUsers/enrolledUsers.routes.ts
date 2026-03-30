import express from "express";
import { enrolledUserController } from "./enrolledUsers.controller.js";
import { auth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  createEnrolledUserSchema,
  updateEnrolledUserSchema,
} from "./enrolledUsers.validation.js";

const router = express.Router();

router.use(auth.protect);

router.get("/", enrolledUserController.getAllEnrolledUsers);
router.get("/:id", enrolledUserController.getEnrolledUser);
router.post(
  "/",
  validate(createEnrolledUserSchema),
  enrolledUserController.createEnrolledUser,
);
router.patch(
  "/:id",
  validate(updateEnrolledUserSchema),
  enrolledUserController.updateEnrolledUser,
);
router.delete(
  "/:id",
  auth.restrictTo("Admin"),
  enrolledUserController.deleteEnrolledUser,
);

export const enrolledUserRoutes = router;
