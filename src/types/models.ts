/**
 * Manually-declared types that mirror the Prisma schema exactly.
 * Keep in sync with prisma/schema/*.prisma
 */

// ── Enums ─────────────────────────────────────────────────────────────────────
export type Role = "Student" | "Instructor" | "Admin";
export type ClassStatus = "Pending" | "Approved" | "Denied";
export type SelectedClassStatus = "Selected" | "Enrolled";

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  password: string | null;
  photo: string | null;
  gender: string | null;
  phoneNumber: string | null;
  address: string | null;
  role: Role;
  classes: number;
  students: number;
  createdAt: Date;
  updatedAt: Date;
}

/** User shape returned in all API responses — password always omitted */
export type SafeUser = Omit<User, "password">;

// ── RefreshToken ──────────────────────────────────────────────────────────────
export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// ── Class ─────────────────────────────────────────────────────────────────────
export interface Class {
  id: string;
  classImage: string | null;
  className: string;
  instructorName: string | null;
  instructorEmail: string | null;
  instructorPhoto: string | null;
  totalSeats: number;
  enrolledStudents: number;
  price: number;
  ratings: number;
  status: ClassStatus;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── SelectedClass ─────────────────────────────────────────────────────────────
export interface SelectedClass {
  id: string;
  userEmail: string;
  instructorEmail: string;
  classID: string;
  classImage: string | null;
  className: string;
  price: number;
  status: SelectedClassStatus;
  enrolledStudents: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── EnrolledUser ──────────────────────────────────────────────────────────────
export interface EnrolledUser {
  id: string;
  userName: string | null;
  email: string;
  classID: string;
  transactionId: string;
  classImage: string | null;
  className: string;
  price: number;
  enrolledStudents: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Query helpers ─────────────────────────────────────────────────────────────
export type WhereInput = Record<string, unknown>;
export type OrderByInput =
  | Record<string, "asc" | "desc">
  | Record<string, "asc" | "desc">[];
