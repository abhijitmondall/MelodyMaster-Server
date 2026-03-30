import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

/**
 * Returns an Express middleware that validates `req.body` against a Zod schema.
 * On success, `req.body` is replaced with the parsed (coerced + defaulted) value.
 */
const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");

      res.status(400).json({ success: false, message });
      return;
    }

    req.body = result.data as unknown;
    next();
  };

export default validate;
