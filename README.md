# 🎵 MelodyMasters API — v3 (TypeScript)

A fully modernised, modular REST API for the MelodyMasters music school platform.

**Stack:** Node 22 · Express 5 · PostgreSQL · Prisma 7 · TypeScript 5 · Zod · Stripe v17 · JWT (Access + Refresh) · Helmet · bcryptjs

---

## Project Structure

```
melodymasters-ts/
├── generated/
│   └── prisma/
│       └── client.ts           # Type stub — replaced by real client after prisma generate
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma       # Generator (prisma-client) + datasource (no url — Prisma 7)
│   │   ├── enums.prisma        # Role, ClassStatus, SelectedClassStatus
│   │   ├── user.prisma         # User model (+ refreshTokens relation)
│   │   ├── auth.prisma         # RefreshToken model (cascade delete)
│   │   ├── class.prisma        # Class model
│   │   ├── selectedClass.prisma
│   │   └── enrolledUser.prisma
│   └── seed.ts                 # Idempotent seed — hashed passwords, classes, admin
├── prisma.config.ts            # Prisma 7 config — adapter, schema path, migrations path
├── src/
│   ├── config/
│   │   └── index.ts            # Centralised env config (typed const — all secrets, JWT TTLs)
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton with PrismaPg adapter
│   ├── middleware/
│   │   ├── auth.ts             # protect (Bearer token) + restrictTo (role guard)
│   │   ├── errorHandler.ts     # Global error handler — Prisma/JWT error normalisation
│   │   └── validate.ts         # Zod body validation middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.types.ts        # Payload + response interfaces
│   │   │   ├── auth.validation.ts   # Zod schemas (signup, signin, refresh, changePassword)
│   │   │   ├── auth.service.ts      # Business logic — bcrypt, JWT, token rotation
│   │   │   ├── auth.controller.ts   # Route handlers (catchAsync)
│   │   │   └── auth.routes.ts       # /api/v1/auth/* routes
│   │   ├── users/
│   │   │   ├── users.types.ts
│   │   │   ├── users.validation.ts
│   │   │   ├── users.service.ts     # Password always stripped (SafeUser)
│   │   │   ├── users.controller.ts
│   │   │   └── users.routes.ts
│   │   ├── classes/
│   │   │   ├── classes.types.ts     # ClassWithAvailableSeats (computed virtual)
│   │   │   ├── classes.validation.ts
│   │   │   ├── classes.service.ts
│   │   │   ├── classes.controller.ts
│   │   │   └── classes.routes.ts
│   │   ├── selectedClasses/
│   │   │   ├── selectedClasses.types.ts
│   │   │   ├── selectedClasses.validation.ts
│   │   │   ├── selectedClasses.service.ts
│   │   │   ├── selectedClasses.controller.ts
│   │   │   └── selectedClasses.routes.ts
│   │   ├── enrolledUsers/
│   │   │   ├── enrolledUsers.types.ts
│   │   │   ├── enrolledUsers.validation.ts
│   │   │   ├── enrolledUsers.service.ts
│   │   │   ├── enrolledUsers.controller.ts
│   │   │   └── enrolledUsers.routes.ts
│   │   └── payment/
│   │       ├── payment.types.ts
│   │       ├── payment.validation.ts
│   │       ├── payment.service.ts   # Stripe v17 PaymentIntent
│   │       ├── payment.controller.ts
│   │       └── payment.routes.ts
│   ├── types/
│   │   ├── express/
│   │   │   └── index.d.ts      # Augments req.user → User
│   │   └── models.ts           # All model interfaces + enums (source of truth for types)
│   ├── utils/
│   │   ├── appError.ts         # Operational error class (statusCode, isOperational)
│   │   ├── catchAsync.ts       # Async route handler wrapper — forwards errors to next()
│   │   ├── queryBuilder.ts     # PrismaQueryBuilder — filter, sort, search, paginate
│   │   └── sendResponse.ts     # Typed JSON response helper
│   ├── dev-scripts/
│   │   └── seedAdmin.ts        # One-shot admin user creator
│   ├── app.ts                  # Express app — middleware stack + all routes + error handler
│   └── server.ts               # Entry point — DB connect, graceful SIGTERM/SIGINT shutdown
├── .env.example
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
# postinstall automatically runs: prisma generate
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in all required values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/melodymasters"

JWT_SECRET=your-access-token-secret-min-32-chars
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your-refresh-token-secret-different-from-above
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_TTL_MS=604800000

PAYMENT_SECRET_KEY=sk_test_your_stripe_key
```

### 3. Push schema to database

```bash
npm run db:push       # development (no migration history)
# or
npm run db:migrate    # production (creates migration files)
```

### 4. Seed sample data

```bash
npm run db:seed
# Seeds 6 instructors, 8 classes, 1 admin user
# Admin login: admin@melodymasters.com / admin1234
# Instructor passwords follow pattern: <firstname>1234
```

### 5. Start development server

```bash
npm run dev           # tsx watch — hot reload, no build step needed
```

### 6. Build for production

```bash
npm run build         # prisma generate + tsup → dist/
npm start
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server health check + timestamp |

---

### Auth `/auth`

#### Token Strategy
- **Access token** — short-lived (`15m` default), sent as `Authorization: Bearer <token>`
- **Refresh token** — long-lived (`7d` default), stored in DB, sent in request body
- **Rotation** — every `/refresh` call deletes the old token and issues a new pair

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | Public | Register — returns `{ user, tokens: { accessToken, refreshToken } }` |
| `POST` | `/auth/signin` | Public | Login — returns `{ user, tokens: { accessToken, refreshToken } }` |
| `POST` | `/auth/refresh` | Public | Exchange refresh token → new token pair (rotation) |
| `POST` | `/auth/signout` | Public | Revoke one refresh token |
| `POST` | `/auth/signout-all` | 🔒 Any | Revoke all refresh tokens (sign out all devices) |
| `GET` | `/auth/me` | 🔒 Any | Get own profile (password never returned) |
| `PATCH` | `/auth/me` | 🔒 Any | Update own profile (name, photo, gender, phoneNumber, address) |
| `PATCH` | `/auth/me/change-password` | 🔒 Any | Change password — revokes all refresh tokens |
| `PATCH` | `/auth/admin/set-password/:userId` | 🔒 Admin | Force-set any user's password |
| `GET` | `/auth/jwt/:email` | Public | Issue JWT (legacy Firebase flow) |

**Signup body:**
```json
{
  "name": "Avi",
  "email": "avi@example.com",
  "password": "secret123",
  "role": "Student"
}
```

**Signin body:**
```json
{ "email": "avi@example.com", "password": "secret123" }
```

**Refresh body:**
```json
{ "refreshToken": "<your-refresh-token>" }
```

**Change password body:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```

---

### Users `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/instructors` | Public | Top instructors sorted by student count |
| `POST` | `/users` | Public | Create/upsert user (Firebase auth flow) |
| `GET` | `/users` | 🔒 Any | List all users (filterable, paginated) |
| `GET` | `/users/:id` | 🔒 Any | Get user by ID |
| `PATCH` | `/users/:id` | 🔒 Any | Update user |
| `PATCH` | `/users/email/:email` | 🔒 Any | Update instructor class/student counts |
| `DELETE` | `/users/:id` | 🔒 Admin | Delete user |

---

### Classes `/classes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/classes` | Public | List all classes — includes computed `availableSeats` |
| `GET` | `/classes/:id` | Public | Get class by ID |
| `POST` | `/classes` | 🔒 Instructor/Admin | Create class |
| `PATCH` | `/classes/:id` | 🔒 Instructor/Admin | Update class |
| `DELETE` | `/classes/:id` | 🔒 Admin | Delete class |

---

### Selected Classes `/selectedClasses`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/selectedClasses` | 🔒 Any | List selected classes |
| `GET` | `/selectedClasses/:id` | 🔒 Any | Get selected class |
| `POST` | `/selectedClasses` | 🔒 Any | Select a class |
| `PATCH` | `/selectedClasses/:id` | 🔒 Any | Update selection |
| `DELETE` | `/selectedClasses/:id` | 🔒 Any | Remove selection |

---

### Enrolled Users `/enrolledUsers`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/enrolledUsers` | 🔒 Any | List enrolled users |
| `GET` | `/enrolledUsers/:id` | 🔒 Any | Get enrolled user |
| `POST` | `/enrolledUsers` | 🔒 Any | Create enrollment record |
| `PATCH` | `/enrolledUsers/:id` | 🔒 Any | Update enrollment |
| `DELETE` | `/enrolledUsers/:id` | 🔒 Admin | Delete enrollment |

---

### Payment `/payment`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/payment/create-payment-intent` | 🔒 Any | Create Stripe Payment Intent — returns `clientSecret` |

**Body:**
```json
{ "price": 25.00 }
```

---

## Query Parameters

All list endpoints support:

| Param | Example | Description |
|---|---|---|
| `search` | `?search=yoga` | Case-insensitive OR search across key string fields |
| `sort` | `?sort=-price,className` | Sort by field — prefix `-` for descending |
| `fields` | `?fields=className,price` | Return only selected fields |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=20` | Results per page (default: 100, max: 500) |
| `status` | `?status=Approved` | Exact filter on any field |
| `price[gte]` | `?price[gte]=10` | Range operators: `gte`, `gt`, `lte`, `lt` |

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload via `tsx watch` |
| `npm run build` | `prisma generate` + compile to `dist/` via `tsup` |
| `npm start` | Run compiled production build from `dist/` |
| `npm run db:generate` | Generate typed Prisma client into `generated/prisma/` |
| `npm run db:push` | Push schema to DB — dev only, no migration files |
| `npm run db:migrate` | Run Prisma migrations — production |
| `npm run db:studio` | Open Prisma Studio GUI at `localhost:5555` |
| `npm run db:seed` | Seed classes, instructors (with hashed passwords), admin |
| `npm run seed:admin` | Create a single admin user |
| `npm run clean` | Remove `dist/` directory |

---

## Authentication Flow

```
POST /auth/signup  ──► { user, tokens: { accessToken, refreshToken } }
POST /auth/signin  ──► { user, tokens: { accessToken, refreshToken } }

// Use accessToken in every request:
Authorization: Bearer <accessToken>

// When accessToken expires (401):
POST /auth/refresh  body: { refreshToken }
  ──► { tokens: { accessToken, refreshToken } }  ← new pair, old refreshToken deleted

// Sign out:
POST /auth/signout      body: { refreshToken }   ← revoke one device
POST /auth/signout-all                            ← revoke all devices (requires auth)
```

---

## Error Response Format

All errors return a consistent JSON shape:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

In development (`NODE_ENV=development`), responses also include `stack` and `error` fields.

| Code | Meaning |
|---|---|
| 400 | Bad request / validation failure |
| 401 | Unauthenticated — invalid or expired token |
| 403 | Forbidden — insufficient role |
| 404 | Record not found |
| 409 | Conflict — duplicate email/unique constraint |
| 502 | Upstream service error (e.g. Stripe) |
| 500 | Unexpected server error |

---

## Key Design Decisions

- **Prisma 7** — split schema folder, `prisma-client` generator, `PrismaPg` adapter, no `url` in schema
- **Refresh token rotation** — every refresh revokes the old token, preventing replay attacks
- **Password never leaks** — `toSafeUser()` strips password before any response leaves the service layer
- **`catchAsync` everywhere** — zero try/catch blocks in controllers; all errors flow to the global handler
- **`AppError`** — all operational errors carry `statusCode` + `isOperational`; unexpected errors show a generic message in production
- **Zod validation** — every POST/PATCH route validated at the middleware layer before reaching the controller
