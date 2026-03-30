import express from "express";
import { paymentController } from "./payment.controller.js";
import { auth } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  paymentIntentSchema,
  checkoutSessionSchema,
  cancelCheckoutSchema,
} from "./payment.validation.js";

const router = express.Router();

// ── Webhook — MUST be registered BEFORE express.json() in app.ts ─────────────
// Raw body is required for Stripe signature verification.
// Mounted at /api/v1/payment/webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // ← raw body only for this route
  paymentController.handleWebhook,
);

// ── Protected routes ──────────────────────────────────────────────────────────

// Legacy PaymentIntent
router.post(
  "/create-payment-intent",
  auth.protect,
  express.json({ limit: "10kb" }),
  validate(paymentIntentSchema),
  paymentController.createPaymentIntent,
);

// New: Stripe Checkout Session
router.post(
  "/checkout",
  auth.protect,
  express.json({ limit: "10kb" }),
  validate(checkoutSessionSchema),
  paymentController.createCheckoutSession,
);

// Cleanup pending enrollment when user cancels Stripe
router.post(
  "/cancel",
  auth.protect,
  express.json({ limit: "10kb" }),
  validate(cancelCheckoutSchema),
  paymentController.cancelCheckoutSession,
);

// Verify session after redirect from Stripe
router.get("/verify", auth.protect, paymentController.verifyCheckoutSession);

export const paymentRoutes = router;
