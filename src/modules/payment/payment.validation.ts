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

// Cancel callback cleanup (delete Pending enrollment created for checkout)
export const cancelCheckoutSchema = z.object({
  selectedClassId: z
    .string({ required_error: "selectedClassId is required" })
    .min(1, "selectedClassId cannot be empty"),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
export type CancelCheckoutInput = z.infer<typeof cancelCheckoutSchema>;
