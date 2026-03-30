import express from "express";
import { classController } from "./classes.controller.js";
import { auth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { createClassSchema, updateClassSchema } from "./classes.validation.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClass);

// ── Protected ─────────────────────────────────────────────────────────────────
router.post(
  "/",
  auth.protect,
  auth.restrictTo("Instructor", "Admin"),
  validate(createClassSchema),
  classController.createClass,
);

router.patch(
  "/:id",
  auth.protect,
  auth.restrictTo("Instructor", "Admin"),
  validate(updateClassSchema),
  classController.updateClass,
);

router.delete(
  "/:id",
  auth.protect,
  auth.restrictTo("Instructor", "Admin"),
  classController.deleteClass,
);

export const classRoutes = router;
