import type { Response } from "express";

interface SendResponseOptions<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  results?: number;
}

const sendResponse = <T>(res: Response, options: SendResponseOptions<T>): void => {
  const { statusCode, success, message, data, total, results } = options;

  const body: Record<string, unknown> = { success, message };

  if (results !== undefined) body["results"] = results;
  if (total !== undefined) body["total"] = total;
  if (data !== undefined) body["data"] = data;

  res.status(statusCode).json(body);
};

export default sendResponse;
