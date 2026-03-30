import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { userService } from "../users/users.service.js";
import { AppError } from "../../utils/appError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import type {
  SignupInput,
  SigninInput,
  UpdateProfileInput,
  ChangePasswordInput,
  RefreshTokenInput,
} from "./auth.validation.js";

// ── POST /api/v1/auth/signup ──────────────────────────────────────────────────
const signup = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as SignupInput;

  if (body.role && (body.role as string) === "Admin")
    throw new AppError("You do not have permission to sign up as Admin.", 403);

  const result = await authService.signup(body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Account created successfully.",
    data: result,
  });
});

// ── POST /api/v1/auth/signin ──────────────────────────────────────────────────
const signin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as SigninInput;
  const result = await authService.signin(email, password);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Signed in successfully.",
    data: result,
  });
});

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  const result = await authService.refreshTokens(refreshToken);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tokens refreshed successfully.",
    data: result,
  });
});

// ── POST /api/v1/auth/signout ─────────────────────────────────────────────────
const signout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  await authService.signout(refreshToken);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Signed out successfully.",
  });
});

// ── POST /api/v1/auth/signout-all ─────────────────────────────────────────────
const signoutAll = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Please log in.", 401);
  await authService.signoutAll(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Signed out from all devices.",
  });
});

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Please log in.", 401);
  const user = await authService.getMe(req.user.id);
  if (!user) throw new AppError("User not found.", 404);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile retrieved successfully.",
    data: user,
  });
});

// ── PATCH /api/v1/auth/me ─────────────────────────────────────────────────────
const updateMe = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) throw new AppError("Please log in.", 401);

  const exists = await userService.getUserByID(id);
  if (!exists) throw new AppError(`No user found with ID: ${id}`, 404);

  const updated = await authService.updateMe(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully.",
    data: updated,
  });
});

// ── PATCH /api/v1/auth/me/change-password ────────────────────────────────────
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) throw new AppError("Please log in.", 401);

  const exists = await userService.getUserByID(id);
  if (!exists) throw new AppError(`No user found with ID: ${id}`, 404);

  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  const updated = await authService.changePassword(
    id,
    currentPassword,
    newPassword,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully. Please sign in again.",
    data: updated,
  });
});

// ── PATCH /api/v1/auth/admin/set-password/:userId ────────────────────────────
const adminSetPassword = catchAsync(async (req: Request, res: Response) => {
  const rawId = req.params["userId"];
  const userId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!userId) throw new AppError("userId param is required.", 400);

  const exists = await userService.getUserByID(userId);
  if (!exists) throw new AppError(`No user found with ID: ${userId}`, 404);

  const { newPassword } = req.body as { newPassword: string };
  if (!newPassword || newPassword.trim().length < 6)
    throw new AppError("New password must be at least 6 characters.", 400);

  const updated = await authService.adminSetPassword(userId, newPassword);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User password updated.",
    data: updated,
  });
});

// ── GET /api/v1/auth/jwt/:email (legacy Firebase) ────────────────────────────
const issueJWT = catchAsync(async (req: Request, res: Response) => {
  const rawEmail = req.params["email"];
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  if (!email) throw new AppError("Email param is required.", 400);

  const result = await authService.issueToken(email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "JWT issued successfully.",
    data: result,
  });
});

export const authController = {
  signup,
  signin,
  refresh,
  signout,
  signoutAll,
  getMe,
  updateMe,
  changePassword,
  adminSetPassword,
  issueJWT,
};
