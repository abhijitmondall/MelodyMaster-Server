import type { SelectedClass } from "../../types/models.js";

export type { SelectedClass };

export interface GetSelectedClassesResult {
  selectedClasses: SelectedClass[];
  total: number;
}
