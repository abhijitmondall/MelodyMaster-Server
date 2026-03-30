import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Please provide a valid email address"),
  photo: z.string().url("Photo must be a valid URL").optional(),
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["Student", "Instructor", "Admin"]).default("Student"),
});

export const updateUserSchema = createUserSchema
  .omit({ email: true })
  .partial();

export const updateUserBasicInfoSchema = z.object({
  classes: z.number().int().min(0).optional(),
  students: z.number().int().min(0).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserBasicInfoInput = z.infer<typeof updateUserBasicInfoSchema>;
