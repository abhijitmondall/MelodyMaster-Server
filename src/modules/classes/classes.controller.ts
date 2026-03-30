import type { Request, Response } from "express";
import { classService } from "./classes.service.js";
import { AppError } from "../../utils/appError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

const getAllClasses = catchAsync(async (req: Request, res: Response) => {
  const { classes, total } = await classService.getAllClasses(
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Classes retrieved successfully.",
    results: classes.length,
    total,
    data: classes,
  });
});

const getClass = catchAsync(async (req: Request, res: Response) => {
  const cls = await classService.getClassByID(req.params["id"] as string);
  if (!cls)
    throw new AppError(`No Class found with ID: ${req.params["id"]}`, 404);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class retrieved successfully.",
    data: cls,
  });
});

const createClass = catchAsync(async (req: Request, res: Response) => {
  const cls = await classService.createClass(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Class created successfully.",
    data: cls,
  });
});

const updateClass = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const user = req.user!;

  // If not admin, check ownership
  if (user.role !== "Admin") {
    const cls = await classService.getClassByID(id);
    if (!cls) throw new AppError(`No Class found with ID: ${id}`, 404);
    if (cls.instructorEmail !== user.email) {
      throw new AppError("You can only update your own classes.", 403);
    }
  }

  const cls = await classService.updateClass(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class updated successfully.",
    data: cls,
  });
});

const deleteClass = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const user = req.user!;

  // If not admin, check ownership
  if (user.role !== "Admin") {
    const cls = await classService.getClassByID(id);
    if (!cls) throw new AppError(`No Class found with ID: ${id}`, 404);
    if (cls.instructorEmail !== user.email) {
      throw new AppError("You can only delete your own classes.", 403);
    }
  }

  await classService.deleteClass(id);
  res.status(204).send();
});

export const classController = {
  getAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
};
