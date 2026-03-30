import type { SafeUser } from "../../types/models.js";

export type { SafeUser };

export interface GetUsersQuery {
  search?: string;
  role?: string;
  sort?: string;
  fields?: string;
  page?: string;
  limit?: string;
  [key: string]: unknown;
}

export interface GetUsersResult {
  users: SafeUser[];
  total: number;
}
