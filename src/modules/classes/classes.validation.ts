import { z } from "zod";

export const createClassSchema = z.object({
  classImage: z.string().optional(),
  className: z.string().trim().min(1, "A class must have a name"),
  instructorName: z.string().optional(),
  instructorEmail: z.string().email("Invalid instructor email").optional(),
  instructorPhoto: z.string().optional(),
  totalSeats: z.coerce.number().int().min(0).default(0),
  enrolledStudents: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0, "A class must have a price"),
  ratings: z.coerce.number().min(0).max(5).default(4.5),
  status: z.enum(["Pending", "Approved", "Denied"]).default("Pending"),
  description: z.string().max(1000).optional(),
  feedback: z.string().max(300).optional(),
});

export const updateClassSchema = z.object({
  classImage: z.string().optional(),
  className: z.string().trim().min(1, "A class must have a name").optional(),
  instructorName: z.string().optional(),
  instructorEmail: z.string().email("Invalid instructor email").optional(),
  instructorPhoto: z.string().optional(),
  totalSeats: z.number().int().min(0).optional(),
  enrolledStudents: z.number().int().min(0).optional(),
  price: z.number().min(0, "A class must have a price").optional(),
  ratings: z.number().min(0).max(5).optional(),
  status: z.enum(["Pending", "Approved", "Denied"]).optional(),
  description: z.string().max(1000).optional(),
  feedback: z.string().max(300).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
