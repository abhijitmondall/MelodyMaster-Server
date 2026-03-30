import type { Request, Response } from "express";
import { userService } from "./users.service.js";
import { AppError } from "../../utils/appError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { users, total } = await userService.getAllUsers(req.query as Record<string, unknown>);
  sendResponse(res, { statusCode: 200, success: true, message: "Users retrieved successfully.", results: users.length, total, data: users });
});

const getInstructors = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query["limit"] as string);
  const instructors = await userService.getInstructors(isNaN(limit) ? undefined : limit);
  sendResponse(res, { statusCode: 200, success: true, message: "Instructors retrieved successfully.", results: instructors.length, data: instructors });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserByID(req.params["id"] as string);
  if (!user) throw new AppError(`No User found with ID: ${req.params["id"]}`, 404);
  sendResponse(res, { statusCode: 200, success: true, message: "User retrieved successfully.", data: user });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  if (!user) {
    res.status(200).json({ success: true, message: "User already exists." });
    return;
  }
  sendResponse(res, { statusCode: 201, success: true, message: "User created successfully.", data: user });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params["id"] as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "User updated successfully.", data: user });
});

const updateUserBasicInfo = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserBasicInfo(req.params["email"] as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "User info updated successfully.", data: user });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params["id"] as string);
  res.status(204).send();
});

export const userController = {
  getAllUsers, getInstructors, getUser, createUser, updateUser, updateUserBasicInfo, deleteUser,
};
