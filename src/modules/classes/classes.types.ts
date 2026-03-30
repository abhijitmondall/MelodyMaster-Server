// import type { Class } from "../../types/models.js";

import { Class } from "../../../generated/prisma/client";

// export type { Class };

// Computed virtual field — mirrors the original Mongoose virtual
export type ClassWithAvailableSeats = Class & { availableSeats: number };

export interface GetClassesResult {
  classes: ClassWithAvailableSeats[];
  total: number;
}
