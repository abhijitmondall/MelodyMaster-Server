import { z } from "zod";

export const createEnrolledUserSchema = z.object({
  userName: z.string().optional(),
  email: z.string().trim().email("Invalid email address"),
  classID: z.string().min(1, "classID is required"),
  transactionId: z.string().min(1, "transactionId is required"),
  classImage: z.string().optional(),
  className: z.string().trim().min(1, "A class must have a name"),
  price: z.number().min(0, "Price must be 0 or greater"),
  enrolledStudents: z.number().int().min(0).optional(),
  status: z.string().default("Paid"),
});

export const updateEnrolledUserSchema = createEnrolledUserSchema.partial();

export type CreateEnrolledUserInput = z.infer<typeof createEnrolledUserSchema>;
export type UpdateEnrolledUserInput = z.infer<typeof updateEnrolledUserSchema>;
