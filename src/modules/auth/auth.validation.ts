import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Please provide a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(64, "Password must not exceed 64 characters"),
  photo: z.string().url("Photo must be a valid URL").optional(),
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["Student", "Instructor"]).default("Student"),
});

export const signinSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  photo: z.string().url("Photo must be a valid URL").optional(),
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long")
      .max(64, "New password must not exceed 64 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
