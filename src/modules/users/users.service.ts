import { prisma } from "../../lib/prisma.js";
import { PrismaQueryBuilder } from "../../utils/queryBuilder.js";
import type { User, SafeUser } from "../../types/models.js";
import type {
  CreateUserInput,
  UpdateUserBasicInfoInput,
  UpdateUserInput,
} from "./users.validation.js";
import type { GetUsersResult } from "./users.types.js";

const USER_SEARCH_FIELDS = ["name", "email"];

/** Remove password before returning to any caller */
const toSafeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = user;
  return safe;
};

// ── Get all users ─────────────────────────────────────────────────────────────
const getAllUsers = async (
  rawQuery: Record<string, unknown>,
): Promise<GetUsersResult> => {
  const qb = new PrismaQueryBuilder(rawQuery, USER_SEARCH_FIELDS);
  const { where, orderBy, skip, take } = qb.build();

  const [rawUsers, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy, skip, take }) as Promise<User[]>,
    prisma.user.count({ where }),
  ]);

  return { users: rawUsers.map(toSafeUser), total };
};

// ── Get user by ID ────────────────────────────────────────────────────────────
const getUserByID = async (id: string): Promise<SafeUser | null> => {
  const user = (await prisma.user.findFirst({ where: { id } })) as User | null;
  return user ? toSafeUser(user) : null;
};

// ── Get user by email — returns FULL user (password included) for auth ────────
const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findFirst({ where: { email } }) as Promise<User | null>;
};

// ── Create user — upsert-by-email mirrors Firebase auth flow ──────────────────
const createUser = async (
  payload: CreateUserInput,
): Promise<SafeUser | null> => {
  const existing = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (existing) return null; // signal "already exists" to controller

  const user = await prisma.user.create({ data: payload as User });
  return toSafeUser(user);
};

// ── Update user by ID ─────────────────────────────────────────────────────────
const updateUser = async (id: string, payload: User): Promise<SafeUser> => {
  const user = (await prisma.user.update({
    where: { id },
    data: payload,
  })) as User;
  return toSafeUser(user);
};

// ── Update classes & students count (instructor stats) ────────────────────────
const updateUserBasicInfo = async (
  email: string,
  payload: User,
): Promise<SafeUser> => {
  const user = (await prisma.user.update({
    where: { email },
    data: payload,
  })) as User;
  return toSafeUser(user);
};

// ── Delete user by ID ─────────────────────────────────────────────────────────
const deleteUser = async (id: string): Promise<SafeUser> => {
  // Revoke all refresh tokens (force logout across devices)
  await prisma.refreshToken.deleteMany({ where: { userId: id } });

  // Preserve user email before deletion to clean up related records.
  const userToDelete = await prisma.user.findUnique({ where: { id } });
  const userEmail = userToDelete?.email;

  if (userEmail) {
    await prisma.selectedClass.deleteMany({ where: { userEmail } });
    await prisma.enrolledUser.deleteMany({ where: { email: userEmail } });
  }

  const user = (await prisma.user.delete({ where: { id } })) as User;
  return toSafeUser(user);
};

// ── Get instructors sorted by student count ───────────────────────────────────
const getInstructors = async (limit?: number): Promise<SafeUser[]> => {
  const users = (await prisma.user.findMany({
    where: { role: "Instructor" },
    orderBy: { students: "desc" },
    ...(limit && limit > 0 ? { take: limit } : {}),
  })) as User[];
  return users.map(toSafeUser);
};

export const userService = {
  getAllUsers,
  getUserByID,
  getUserByEmail,
  createUser,
  updateUser,
  updateUserBasicInfo,
  deleteUser,
  getInstructors,
};
