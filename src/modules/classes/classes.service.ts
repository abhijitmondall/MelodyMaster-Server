import { prisma } from "../../lib/prisma.js";
import { PrismaQueryBuilder } from "../../utils/queryBuilder.js";
// import type { Class } from "../../types/models.js";
import type {
  CreateClassInput,
  UpdateClassInput,
} from "./classes.validation.js";
import type {
  ClassWithAvailableSeats,
  GetClassesResult,
} from "./classes.types.js";
import { AppError } from "../../utils/appError.js";
import { Role } from "../../../generated/prisma/enums.js";
import { Class } from "../../../generated/prisma/client.js";
import { UserWhereInput } from "../../../generated/prisma/models.js";

const CLASS_SEARCH_FIELDS = ["className", "instructorName", "instructorEmail"];

const withSeats = (cls: Class): ClassWithAvailableSeats => ({
  ...cls,
  availableSeats: cls.totalSeats - cls.enrolledStudents,
});

const getAllClasses = async (
  rawQuery: Record<string, unknown>,
): Promise<GetClassesResult> => {
  const qb = new PrismaQueryBuilder(rawQuery, CLASS_SEARCH_FIELDS);
  const { where, orderBy, skip, take } = qb.build();

  const [classes, total] = await Promise.all([
    prisma.class.findMany({ where, orderBy, skip, take }) as Promise<Class[]>,
    prisma.class.count({ where }),
  ]);

  return { classes: classes.map(withSeats), total };
};

const getClassByID = async (
  id: string,
): Promise<ClassWithAvailableSeats | null> => {
  const cls = (await prisma.class.findFirst({ where: { id } })) as Class | null;
  return cls ? withSeats(cls) : null;
};

const createClass = async (
  payload: CreateClassInput,
): Promise<ClassWithAvailableSeats> => {
  const instructor = await prisma.user.findFirst({
    where: {
      email: payload.instructorEmail,
      role: Role.Instructor,
    } as UserWhereInput,
  });

  if (!instructor) {
    throw new AppError(
      `No Instructor found with this Email: ${payload.instructorEmail}`,
      404,
    );
  }

  const cls = await prisma.class.create({ data: payload as Class });
  return withSeats(cls);
};

const updateClass = async (
  id: string,
  payload: Class,
): Promise<ClassWithAvailableSeats> => {
  const data = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined),
  ) as Class;

  const cls = await prisma.class.update({ where: { id }, data });
  return withSeats(cls);
};

const deleteClass = async (id: string): Promise<Class> => {
  return prisma.class.delete({ where: { id } }) as Promise<Class>;
};

export const classService = {
  getAllClasses,
  getClassByID,
  createClass,
  updateClass,
  deleteClass,
};
