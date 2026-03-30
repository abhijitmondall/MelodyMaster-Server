type SortOrder = "asc" | "desc";
type OrderByClause = Record<string, SortOrder>;

export interface QueryBuilderResult {
  where: Record<string, unknown>;
  orderBy: OrderByClause | OrderByClause[];
  skip: number;
  take: number;
  select?: Record<string, boolean>;
}

/**
 * PrismaQueryBuilder
 *
 * Accepts Express `req.query` and produces a Prisma-compatible findMany
 * options object supporting:
 *   • filter   — ?status=Approved  or  ?price[gte]=10
 *   • search   — ?search=yoga  (case-insensitive OR contains across searchFields)
 *   • sort     — ?sort=-price,className  (prefix `-` = descending)
 *   • fields   — ?fields=className,price
 *   • paginate — ?page=2&limit=20
 */
export class PrismaQueryBuilder {
  private readonly _rawQuery: Record<string, unknown>;
  private readonly _searchFields: string[];

  public where: Record<string, unknown> = {};
  public orderBy: OrderByClause | OrderByClause[] = [{ createdAt: "desc" }];
  public skip = 0;
  public take = 100;
  public select: Record<string, boolean> | undefined = undefined;

  constructor(rawQuery: Record<string, unknown>, searchFields: string[] = []) {
    this._rawQuery = { ...rawQuery };
    this._searchFields = searchFields;
    this._build();
  }

  private _build(): void {
    this._applyFilter();
    this._applySearch();
    this._applySort();
    this._applyFieldLimiting();
    this._applyPagination();
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  private _applyFilter(): void {
    const excluded = new Set(["sort", "fields", "page", "limit", "search"]);
    const raw = Object.fromEntries(
      Object.entries(this._rawQuery).filter(([k]) => !excluded.has(k)),
    );

    const opMap: Record<string, string> = {
      gte: "gte",
      gt: "gt",
      lte: "lte",
      lt: "lt",
    };

    const where: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const conditions: Record<string, unknown> = {};
        for (const [op, val] of Object.entries(value as Record<string, string>)) {
          const prismaOp = opMap[op];
          if (prismaOp) {
            conditions[prismaOp] = isNaN(Number(val)) ? val : Number(val);
          }
        }
        where[key] = conditions;
      } else {
        where[key] = value;
      }
    }

    this.where = { ...this.where, ...where };
  }

  // ── Search ────────────────────────────────────────────────────────────────
  private _applySearch(): void {
    const search = this._rawQuery["search"] as string | undefined;
    if (!search || this._searchFields.length === 0) return;

    const orClauses = this._searchFields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));

    this.where = { ...this.where, OR: orClauses };
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  private _applySort(): void {
    const sort = this._rawQuery["sort"] as string | undefined;
    if (!sort) return;

    const clauses: OrderByClause[] = sort.split(",").map((part) => {
      const desc = part.startsWith("-");
      const field = desc ? part.slice(1) : part;
      return { [field]: desc ? ("desc" as const) : ("asc" as const) };
    });

    this.orderBy = clauses.length === 1 ? (clauses[0] as OrderByClause) : clauses;
  }

  // ── Field limiting ────────────────────────────────────────────────────────
  private _applyFieldLimiting(): void {
    const fields = this._rawQuery["fields"] as string | undefined;
    if (!fields) return;

    const select: Record<string, boolean> = {};
    fields.split(",").forEach((f) => {
      const excluded = f.startsWith("-");
      const name = excluded ? f.slice(1) : f;
      select[name] = !excluded;
    });
    this.select = select;
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  private _applyPagination(): void {
    const page = Math.max(1, Number(this._rawQuery["page"] ?? 1));
    const limit = Math.min(500, Number(this._rawQuery["limit"] ?? 100));
    this.skip = (page - 1) * limit;
    this.take = limit;
  }

  // ── Build final args ──────────────────────────────────────────────────────
  public build(): QueryBuilderResult {
    const result: QueryBuilderResult = {
      where: this.where,
      orderBy: this.orderBy,
      skip: this.skip,
      take: this.take,
    };
    if (this.select) result.select = this.select;
    return result;
  }
}
