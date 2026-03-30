import { prisma } from "../../lib/prisma.js";
import { PrismaQueryBuilder } from "../../utils/queryBuilder.js";
import { AppError } from "../../utils/appError.js";
import type { SelectedClass } from "../../types/models.js";
import type {
  CreateSelectedClassInput,
  UpdateSelectedClassInput,
} from "./selectedClasses.validation.js";
import type { GetSelectedClassesResult } from "./selectedClasses.types.js";

const SEARCH_FIELDS = ["className", "userEmail", "instructorEmail"];

const getAllSelectedClasses = async (
  rawQuery: Record<string, unknown>,
): Promise<GetSelectedClassesResult> => {
  const qb = new PrismaQueryBuilder(rawQuery, SEARCH_FIELDS);
  const { where, orderBy, skip, take } = qb.build();

  const [selectedClasses, total] = await Promise.all([
    prisma.selectedClass.findMany({ where, orderBy, skip, take }) as Promise<
      SelectedClass[]
    >,
    prisma.selectedClass.count({ where }),
  ]);

  return { selectedClasses, total };
};

const getSelectedClassByID = async (
  id: string,
): Promise<SelectedClass | null> => {
  return prisma.selectedClass.findFirst({
    where: { id },
  }) as Promise<SelectedClass | null>;
};

const createSelectedClass = async (
  payload: SelectedClass,
): Promise<SelectedClass> => {
  const existing = await prisma.selectedClass.findFirst({
    where: {
      userEmail: payload.userEmail,
      classID: payload.classID,
    },
  });

  if (existing) {
    throw new AppError("Class already selected.", 409);
  }

  return prisma.selectedClass.create({
    data: payload,
  }) as Promise<SelectedClass>;
};

const updateSelectedClass = async (
  id: string,
  payload: SelectedClass,
): Promise<SelectedClass> => {
  const data = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined),
  ) as SelectedClass;

  return prisma.selectedClass.update({
    where: { id },
    data,
  }) as Promise<SelectedClass>;
};

const deleteSelectedClass = async (id: string): Promise<SelectedClass> => {
  return prisma.selectedClass.delete({
    where: { id },
  }) as Promise<SelectedClass>;
};

export const selectedClassService = {
  getAllSelectedClasses,
  getSelectedClassByID,
  createSelectedClass,
  updateSelectedClass,
  deleteSelectedClass,
};
