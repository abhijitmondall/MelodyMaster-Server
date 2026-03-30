import Stripe from "stripe";
import config from "../../config/index.js";
import { AppError } from "../../utils/appError.js";
import { prisma } from "../../lib/prisma.js";
import type {
  PaymentIntentResult,
  CheckoutSessionResult,
} from "./payment.types.js";

// ── Stripe singleton ──────────────────────────────────────────────────────────
const stripe = new Stripe(config.payment_secret_key, {
  apiVersion: "2025-02-24.acacia",
});

// ── Legacy: PaymentIntent (kept for backward compat) ─────────────────────────
const createPaymentIntent = async (
  price: number,
): Promise<PaymentIntentResult> => {
  if (!price || price <= 0) {
    throw new AppError("A valid positive price is required.", 400);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(price * 100),
    currency: "usd",
    payment_method_types: ["card"],
    description: "MelodyMasters — music class enrollment",
  });

  if (!paymentIntent.client_secret) {
    throw new AppError("Failed to generate client secret from Stripe.", 502);
  }

  return { clientSecret: paymentIntent.client_secret };
};

// ── New: Stripe Checkout Session ──────────────────────────────────────────────
/**
 * 1. Load the SelectedClass + Class records
 * 2. Create a pending EnrolledUser (status = "Pending")
 * 3. Create a Stripe Checkout Session with metadata pointing to that enrollment
 * 4. Return the Stripe-hosted payment URL
 *
 * The actual enrollment confirmation happens in handleWebhook when Stripe
 * fires `checkout.session.completed`.
 */
const createCheckoutSession = async (
  selectedClassId: string,
  userId: string,
  userEmail: string,
  userName: string,
): Promise<CheckoutSessionResult> => {
  // 1. Load selected class
  const selectedClass = await prisma.selectedClass.findFirst({
    where: { id: selectedClassId },
  });

  if (!selectedClass) {
    throw new AppError(
      `No selected class found with ID: ${selectedClassId}`,
      404,
    );
  }

  // Guard: must belong to this user
  if (selectedClass.userEmail !== userEmail) {
    throw new AppError("You can only pay for your own selected classes.", 403);
  }

  // Load the real Class to get latest seat info
  const classRecord = await prisma.class.findFirst({
    where: { id: selectedClass.classID },
  });

  if (!classRecord) {
    throw new AppError(
      `Class with ID ${selectedClass.classID} no longer exists.`,
      404,
    );
  }

  if (classRecord.enrolledStudents >= classRecord.totalSeats) {
    throw new AppError(
      "This class is now full. Please choose another class.",
      400,
    );
  }

  if (classRecord.status !== "Approved") {
    throw new AppError("This class is not available for enrollment.", 400);
  }

  // Check if already enrolled
  const alreadyEnrolled = await prisma.enrolledUser.findFirst({
    where: {
      email: userEmail,
      classID: selectedClass.classID,
      status: "Paid",
    },
  });

  if (alreadyEnrolled) {
    // Clean up stale selected class record for UX consistency
    await prisma.selectedClass.deleteMany({
      where: { id: selectedClassId, userEmail },
    });
    throw new AppError("You are already enrolled in this class.", 409);
  }

  // 2. Create a PENDING enrollment record so we have an ID to store in metadata
  const pendingEnrollment = await prisma.enrolledUser.create({
    data: {
      userName,
      email: userEmail,
      classID: selectedClass.classID,
      transactionId: `pending_${Date.now()}`, // overwritten by webhook
      classImage: selectedClass.classImage,
      className: selectedClass.className,
      price: selectedClass.price,
      enrolledStudents: classRecord.enrolledStudents,
      status: "Pending",
    },
  });

  // 3. Create Stripe Checkout Session
  const isValidImageUrl = (url?: string | null) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const images = isValidImageUrl(selectedClass.classImage)
    ? [selectedClass.classImage as string]
    : [];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: selectedClass.className,
            description: `Instructor: ${selectedClass.instructorEmail ?? "MelodyMasters"} · ${classRecord.totalSeats - classRecord.enrolledStudents} seats remaining`,
            ...(images.length > 0 ? { images } : {}),
          },
          unit_amount: Math.round(selectedClass.price * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      enrollmentId: pendingEnrollment.id,
      selectedClassId,
      classId: selectedClass.classID,
      userEmail,
      userId,
    },
    success_url: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/payment/cancel?selectedClassId=${selectedClassId}`,
  });

  if (!session.url) {
    // Clean up pending enrollment if Stripe session creation failed
    await prisma.enrolledUser.delete({ where: { id: pendingEnrollment.id } });
    throw new AppError("Stripe checkout session URL was not generated.", 502);
  }

  return {
    paymentUrl: session.url,
    enrollmentId: pendingEnrollment.id,
  };
};

// ── Webhook handler ───────────────────────────────────────────────────────────
/**
 * Called by Stripe when checkout.session.completed fires.
 * Idempotent — skips if the enrollment is already Paid.
 */
const handleWebhookEvent = async (
  rawBody: string | Uint8Array,
  signature: string,
): Promise<void> => {
  if (!config.stripe_webhook_secret) {
    throw new AppError("Stripe webhook secret is not configured.", 500);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe_webhook_secret,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new AppError(
      `Stripe webhook signature verification failed: ${msg}`,
      400,
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const enrollmentId = session.metadata?.["enrollmentId"];
      const selectedClassId = session.metadata?.["selectedClassId"];
      const classId = session.metadata?.["classId"];

      if (!enrollmentId || !classId) {
        console.error("[Webhook] Missing metadata in session:", session.id);
        return;
      }

      // Idempotency check — skip if already processed
      const enrollment = await prisma.enrolledUser.findFirst({
        where: { id: enrollmentId },
      });

      if (!enrollment) {
        console.error(`[Webhook] Enrollment ${enrollmentId} not found`);
        return;
      }

      if (enrollment.status === "Paid") {
        console.log(
          `[Webhook] Enrollment ${enrollmentId} already processed — skipping`,
        );
        return;
      }

      // Mark enrollment Paid, increment class count, remove from cart
      await prisma.enrolledUser.update({
        where: { id: enrollmentId },
        data: {
          status: "Paid",
          transactionId: (session.payment_intent as string) ?? session.id,
        },
      });

      await prisma.class.update({
        where: { id: classId },
        data: { enrolledStudents: { increment: 1 } },
      });

      if (selectedClassId) {
        await prisma.selectedClass.deleteMany({
          where: { id: selectedClassId },
        });
      }

      console.log(
        `[Webhook] ✅ Enrollment ${enrollmentId} paid — class ${classId} updated`,
      );
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const enrollmentId = session.metadata?.["enrollmentId"];

      if (enrollmentId) {
        // Clean up the pending enrollment so the user can try again
        await prisma.enrolledUser.deleteMany({
          where: { id: enrollmentId, status: "Pending" },
        });
        console.log(
          `[Webhook] Session expired — cleaned up pending enrollment ${enrollmentId}`,
        );
      }
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }
};

// ── Verify session for success page ──────────────────────────────────────────
/**
 * Called by the success page to confirm a real payment.
 * Returns the enrollment record so the frontend can display details.
 */
const verifyCheckoutSession = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new AppError("Payment has not been completed yet.", 402);
  }

  const enrollmentId = session.metadata?.["enrollmentId"];
  const classId = session.metadata?.["classId"];
  const selectedClassId = session.metadata?.["selectedClassId"];

  if (!enrollmentId || !classId) {
    throw new AppError(
      "Session metadata is missing enrollment or class ID.",
      500,
    );
  }

  const enrollment = await prisma.enrolledUser.findFirst({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    throw new AppError("Enrollment record not found.", 404);
  }

  // Make this path idempotent, in case webhook is delayed/missed.
  if (enrollment.status !== "Paid") {
    await prisma.enrolledUser.update({
      where: { id: enrollmentId },
      data: {
        status: "Paid",
        transactionId: (session.payment_intent as string) ?? session.id,
      },
    });

    await prisma.class.update({
      where: { id: classId },
      data: { enrolledStudents: { increment: 1 } },
    });

    if (selectedClassId) {
      await prisma.selectedClass.deleteMany({
        where: { id: selectedClassId },
      });
    }
  }

  const updatedEnrollment = await prisma.enrolledUser.findFirst({
    where: { id: enrollmentId },
  });

  return {
    enrollment: updatedEnrollment,
    amountPaid: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? "usd",
    customerEmail: session.customer_details?.email ?? "",
    receiptUrl: (session as { receipt_url?: string }).receipt_url ?? null,
  };
};

export const paymentService = {
  createPaymentIntent,
  createCheckoutSession,
  handleWebhookEvent,
  verifyCheckoutSession,
};
