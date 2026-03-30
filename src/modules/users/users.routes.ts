import express from "express";
import { userController } from "./users.controller.js";
import { auth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  updateUserBasicInfoSchema,
} from "./users.validation.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/instructors", userController.getInstructors);
router.post("/", validate(createUserSchema), userController.createUser);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(auth.protect);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch(
  "/email/:email",
  validate(updateUserBasicInfoSchema),
  userController.updateUserBasicInfo,
);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", auth.restrictTo("Admin"), userController.deleteUser);

export const userRoutes = router;
