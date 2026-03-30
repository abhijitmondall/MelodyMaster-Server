import { prisma } from "../../lib/prisma.js";
import { PrismaQueryBuilder } from "../../utils/queryBuilder.js";
import type { EnrolledUser } from "../../types/models.js";
import type {
  CreateEnrolledUserInput,
  UpdateEnrolledUserInput,
} from "./enrolledUsers.validation.js";
import type { GetEnrolledUsersResult } from "./enrolledUsers.types.js";

const SEARCH_FIELDS = ["className", "email", "userName"];

const getAllEnrolledUsers = async (
  rawQuery: Record<string, unknown>,
): Promise<GetEnrolledUsersResult> => {
  const qb = new PrismaQueryBuilder(rawQuery, SEARCH_FIELDS);
  const { where, orderBy, skip, take } = qb.build();

  // Default behavior: only return successful enrollments.
  // Pending enrollments are internal bookkeeping for Stripe checkout.
  if (!("status" in rawQuery)) {
    (where as Record<string, unknown>)["status"] = "Paid";
  }

  const [enrolledUsers, total] = await Promise.all([
    prisma.enrolledUser.findMany({ where, orderBy, skip, take }) as Promise<
      EnrolledUser[]
    >,
    prisma.enrolledUser.count({ where }),
  ]);

  return { enrolledUsers, total };
};

const getEnrolledUserByID = async (
  id: string,
): Promise<EnrolledUser | null> => {
  return prisma.enrolledUser.findFirst({
    where: { id },
  }) as Promise<EnrolledUser | null>;
};

const createEnrolledUser = async (
  payload: CreateEnrolledUserInput,
): Promise<EnrolledUser> => {
  return prisma.enrolledUser.create({ data: payload }) as Promise<EnrolledUser>;
};

const updateEnrolledUser = async (
  id: string,
  payload: UpdateEnrolledUserInput,
): Promise<EnrolledUser> => {
  const data = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined),
  ) as UpdateEnrolledUserInput;
  return prisma.enrolledUser.update({
    where: { id },
    data,
  }) as Promise<EnrolledUser>;
};

const deleteEnrolledUser = async (id: string): Promise<EnrolledUser> => {
  return prisma.enrolledUser.delete({ where: { id } }) as Promise<EnrolledUser>;
};

export const enrolledUserService = {
  getAllEnrolledUsers,
  getEnrolledUserByID,
  createEnrolledUser,
  updateEnrolledUser,
  deleteEnrolledUser,
};
