import { z } from "zod";

export const createSelectedClassSchema = z.object({
  userEmail: z.string().trim().email("Invalid user email"),
  instructorEmail: z.string().trim().email("Invalid instructor email"),
  classID: z.string().min(1, "classID is required"),
  classImage: z.string().optional(),
  className: z.string().trim().min(1, "A class must have a name"),
  price: z.number().min(0, "Price must be 0 or greater"),
  status: z.enum(["Selected", "Enrolled"]).default("Selected"),
  enrolledStudents: z.number().int().min(0).optional(),
});

export const updateSelectedClassSchema = createSelectedClassSchema.partial();

export type CreateSelectedClassInput = z.infer<typeof createSelectedClassSchema>;
export type UpdateSelectedClassInput = z.infer<typeof updateSelectedClassSchema>;
