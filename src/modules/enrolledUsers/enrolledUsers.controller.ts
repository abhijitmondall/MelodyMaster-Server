import type { Request, Response } from "express";
import { enrolledUserService } from "./enrolledUsers.service.js";
import { AppError } from "../../utils/appError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

const getAllEnrolledUsers = catchAsync(async (req: Request, res: Response) => {
  const { enrolledUsers, total } =
    await enrolledUserService.getAllEnrolledUsers(
      req.query as Record<string, unknown>,
    );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrolled users retrieved successfully.",
    results: enrolledUsers.length,
    total,
    data: enrolledUsers,
  });
});

const getEnrolledUser = catchAsync(async (req: Request, res: Response) => {
  const eu = await enrolledUserService.getEnrolledUserByID(
    req.params["id"] as string,
  );
  if (!eu)
    throw new AppError(
      `No Enrolled User found with ID: ${req.params["id"]}`,
      404,
    );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrolled user retrieved successfully.",
    data: { enrolledUser: eu },
  });
});

const createEnrolledUser = catchAsync(async (req: Request, res: Response) => {
  const eu = await enrolledUserService.createEnrolledUser(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Enrolled user created successfully.",
    data: { enrolledUser: eu },
  });
});

const updateEnrolledUser = catchAsync(async (req: Request, res: Response) => {
  const eu = await enrolledUserService.updateEnrolledUser(
    req.params["id"] as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrolled user updated successfully.",
    data: { enrolledUser: eu },
  });
});

const deleteEnrolledUser = catchAsync(async (req: Request, res: Response) => {
  await enrolledUserService.deleteEnrolledUser(req.params["id"] as string);
  res.status(204).send();
});

export const enrolledUserController = {
  getAllEnrolledUsers,
  getEnrolledUser,
  createEnrolledUser,
  updateEnrolledUser,
  deleteEnrolledUser,
};
