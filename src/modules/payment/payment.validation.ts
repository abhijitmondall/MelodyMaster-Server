import { z } from "zod";

// Legacy: PaymentIntent (kept for backward compat)
export const paymentIntentSchema = z.object({
  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be a positive number"),
});

// New: Stripe Checkout Session
export const checkoutSessionSchema = z.object({
  selectedClassId: z
    .string({ required_error: "selectedClassId is required" })
    .min(1, "selectedClassId cannot be empty"),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
