import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/index.js";
import { userService } from "../modules/users/users.service.js";
import { AppError } from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import type { Role } from "../types/models.js";

// ── Protect — verify Bearer access token ─────────────────────────────────────
const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError(
        "You are not logged in. Please log in to get access.",
        401,
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
    } catch (err) {
      if (err instanceof Error && err.name === "TokenExpiredError") {
        throw new AppError(
          "Access token has expired. Please use POST /api/v1/auth/refresh to get a new one.",
          401,
        );
      }
      throw new AppError("Invalid token. Please log in again.", 401);
    }

    const userId = decoded["sub"] as string;
    // Optional fallback for tokens that have only email claim
    const email = decoded["email"] as string | undefined;

    const currentUser = userId
      ? await userService.getUserByID(userId)
      : email
        ? await userService.getUserByEmail(email)
        : null;

    if (!currentUser) {
      throw new AppError(
        "The user belonging to this token no longer exists.",
        401,
      );
    }

    req.user = currentUser;
    next();
  },
);

// ── RestrictTo — role guard ───────────────────────────────────────────────────
// Uses next(err) explicitly so errors flow through the global error handler
// consistently, regardless of Express version.
const restrictTo =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }
    next();
  };

export const auth = { protect, restrictTo };
