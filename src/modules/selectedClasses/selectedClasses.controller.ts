import type { Request, Response } from "express";
import { selectedClassService } from "./selectedClasses.service.js";
import { AppError } from "../../utils/appError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

const getAllSelectedClasses = catchAsync(async (req: Request, res: Response) => {
  const { selectedClasses, total } = await selectedClassService.getAllSelectedClasses(req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: 200, success: true, message: "Selected classes retrieved successfully.", results: selectedClasses.length, total, data: selectedClasses });
});

const getSelectedClass = catchAsync(async (req: Request, res: Response) => {
  const sc = await selectedClassService.getSelectedClassByID(req.params["id"] as string);
  if (!sc) throw new AppError(`No Selected Class found with ID: ${req.params["id"]}`, 404);
  sendResponse(res, { statusCode: 200, success: true, message: "Selected class retrieved successfully.", data: sc });
});

const createSelectedClass = catchAsync(async (req: Request, res: Response) => {
  const sc = await selectedClassService.createSelectedClass(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Class selected successfully.", data: sc });
});

const updateSelectedClass = catchAsync(async (req: Request, res: Response) => {
  const sc = await selectedClassService.updateSelectedClass(req.params["id"] as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Selected class updated successfully.", data: sc });
});

const deleteSelectedClass = catchAsync(async (req: Request, res: Response) => {
  await selectedClassService.deleteSelectedClass(req.params["id"] as string);
  res.status(204).send();
});

export const selectedClassController = {
  getAllSelectedClasses, getSelectedClass, createSelectedClass, updateSelectedClass, deleteSelectedClass,
};
