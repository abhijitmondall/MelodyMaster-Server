import type { NextFunction, Request, Response } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * catchAsync — wraps an async Express route handler so any rejected promise
 * is automatically forwarded to Express's `next(err)` error handler.
 *
 * Usage:
 *   router.get("/", catchAsync(async (req, res) => { ... }));
 *
 * Eliminates try/catch boilerplate in every controller.
 */
const catchAsync =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;
