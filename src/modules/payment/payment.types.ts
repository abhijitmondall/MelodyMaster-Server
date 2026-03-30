// ── Request payloads ──────────────────────────────────────────────────────────

export interface PaymentIntentPayload {
  price: number;
}

export interface CheckoutSessionPayload {
  selectedClassId: string; // ID of the SelectedClass record being paid for
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface PaymentIntentResult {
  clientSecret: string;
}

export interface CheckoutSessionResult {
  paymentUrl: string;       // Stripe-hosted checkout URL
  enrollmentId: string;     // Pending EnrolledUser record ID
}
