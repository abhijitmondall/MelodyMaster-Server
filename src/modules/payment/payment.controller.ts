import type { Request, Response } from "express";
import { paymentService } from "./payment.service.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

// ── POST /api/v1/payment/create-payment-intent (legacy) ───────────────────────
const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const { price } = req.body as { price: number };
  const result = await paymentService.createPaymentIntent(price);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment intent created successfully.",
    data: result,
  });
});

// ── POST /api/v1/payment/checkout ─────────────────────────────────────────────
const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { selectedClassId } = req.body as { selectedClassId: string };
    const user = req.user!;

    const result = await paymentService.createCheckoutSession(
      selectedClassId,
      user.id,
      user.email,
      user.name,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Stripe checkout session created successfully.",
      data: result,
    });
  },
);

// ── POST /api/v1/payment/cancel ────────────────────────────────────────────────
const cancelCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { selectedClassId } = req.body as { selectedClassId: string };
    const user = req.user!;

    const result = await paymentService.cancelCheckoutSession(
      selectedClassId,
      user.email,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Pending enrollment cleaned up.",
      data: result,
    });
  },
);

// ── GET /api/v1/payment/verify?session_id=... ─────────────────────────────────
const verifyCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { session_id } = req.query as { session_id: string };

    if (!session_id) {
      res
        .status(400)
        .json({
          success: false,
          message: "session_id query param is required.",
        });
      return;
    }

    const result = await paymentService.verifyCheckoutSession(session_id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Payment verified successfully.",
      data: result,
    });
  },
);

// ── POST /api/v1/payment/webhook ──────────────────────────────────────────────
// NOTE: This route must receive the RAW request body (not parsed JSON).
//       The middleware is applied directly in app.ts before express.json().
const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    res
      .status(400)
      .json({ success: false, message: "Missing stripe-signature header." });
    return;
  }

  await paymentService.handleWebhookEvent(
    req.body as string | Uint8Array,
    signature,
  );

  // Stripe requires a 200 response to acknowledge receipt
  res.status(200).json({ received: true });
});

export const paymentController = {
  createPaymentIntent,
  createCheckoutSession,
  cancelCheckoutSession,
  verifyCheckoutSession,
  handleWebhook,
};
