import express from "express";
import { authController } from "./auth.controller.js";
import { auth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  signupSchema,
  signinSchema,
  updateProfileSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from "./auth.validation.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/signup", validate(signupSchema), authController.signup);
router.post("/signin", validate(signinSchema), authController.signin);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.post("/signout", validate(refreshTokenSchema), authController.signout);

// ── Legacy Firebase JWT issuance ──────────────────────────────────────────────
router.get("/jwt/:email", authController.issueJWT);

// ── Protected — current user ──────────────────────────────────────────────────
router.get("/me", auth.protect, authController.getMe);
router.patch("/me", auth.protect, validate(updateProfileSchema), authController.updateMe);
router.patch("/me/change-password", auth.protect, validate(changePasswordSchema), authController.changePassword);
router.post("/signout-all", auth.protect, authController.signoutAll);

// ── Admin only ────────────────────────────────────────────────────────────────
router.patch(
  "/admin/set-password/:userId",
  auth.protect,
  auth.restrictTo("Admin"),
  authController.adminSetPassword,
);

export const authRoutes = router;
