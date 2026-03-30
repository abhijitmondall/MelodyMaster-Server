import type { EnrolledUser } from "../../types/models.js";

export type { EnrolledUser };

export interface GetEnrolledUsersResult {
  enrolledUsers: EnrolledUser[];
  total: number;
}
