import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

// ── Prisma error normalisation ────────────────────────────────────────────────
const handlePrismaNotFound = (): AppError =>
  new AppError("The requested record was not found.", 404);

const handlePrismaUniqueConstraint = (meta: Record<string, unknown>): AppError => {
  const fields = Array.isArray(meta["target"])
    ? (meta["target"] as string[]).join(", ")
    : "field";
  return new AppError(
    `Duplicate value for: ${fields}. Please use a different value.`,
    409,
  );
};

const handlePrismaForeignKey = (): AppError =>
  new AppError("Related record not found. Check your foreign key reference.", 400);

const handlePrismaValidation = (message: string): AppError =>
  new AppError(`Validation error: ${message}`, 400);

// ── JWT error normalisation ────────────────────────────────────────────────────
const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpired = (): AppError =>
  new AppError("Your token has expired. Please log in again.", 401);

// ── Response senders ──────────────────────────────────────────────────────────
interface ErrorWithExtras extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
  meta?: Record<string, unknown>;
}

const sendErrorDev = (err: ErrorWithExtras, res: Response): void => {
  res.status(err.statusCode ?? 500).json({
    success: false,
    status: err.status ?? "error",
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err: ErrorWithExtras, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode ?? 500).json({
      success: false,
      message: err.message,
    });
  } else {
    // Don't leak internal details in production
    console.error("💥 Unexpected error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ── Global handler (4-arg signature required by Express) ──────────────────────
const globalErrorHandler = (
  err: ErrorWithExtras,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? "error";

  if (process.env["NODE_ENV"] === "development") {
    sendErrorDev(err, res);
    return;
  }

  // Production — normalise known error types
  let error: ErrorWithExtras = { ...err, message: err.message, name: err.name };

  // Prisma errors
  if (err.code === "P2025") error = handlePrismaNotFound();
  if (err.code === "P2002") error = handlePrismaUniqueConstraint(err.meta ?? {});
  if (err.code === "P2003") error = handlePrismaForeignKey();
  if (err.code === "P2000" || err.name === "PrismaClientValidationError")
    error = handlePrismaValidation(err.message);

  // JWT errors
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpired();

  sendErrorProd(error, res);
};

export default globalErrorHandler;
