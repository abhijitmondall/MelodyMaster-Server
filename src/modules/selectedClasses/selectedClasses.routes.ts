import express from "express";
import { selectedClassController } from "./selectedClasses.controller.js";
import { auth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  createSelectedClassSchema,
  updateSelectedClassSchema,
} from "./selectedClasses.validation.js";

const router = express.Router();

// All selected-class routes require auth
router.use(auth.protect);

router.get("/", selectedClassController.getAllSelectedClasses);
router.get("/:id", selectedClassController.getSelectedClass);
router.post(
  "/",
  validate(createSelectedClassSchema),
  selectedClassController.createSelectedClass,
);
router.patch(
  "/:id",
  validate(updateSelectedClassSchema),
  selectedClassController.updateSelectedClass,
);
router.delete("/:id", selectedClassController.deleteSelectedClass);

export const selectedClassRoutes = router;
