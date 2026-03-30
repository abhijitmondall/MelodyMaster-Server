/**
 * AppError — thrown for expected, operational errors (4xx / 5xx).
 *
 * Anything that is `isOperational = true` gets its message sent to the client
 * in production. Unexpected errors (programming bugs, DB crashes, etc.) get
 * a generic "Something went wrong" message instead.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
