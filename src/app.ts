import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import config from "./config/index.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/users/users.routes.js";
import { classRoutes } from "./modules/classes/classes.routes.js";
import { selectedClassRoutes } from "./modules/selectedClasses/selectedClasses.routes.js";
import { enrolledUserRoutes } from "./modules/enrolledUsers/enrolledUsers.routes.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";

import globalErrorHandler from "./middleware/errorHandler.js";
import { AppError } from "./utils/appError.js";

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowed_origins.includes(origin))
        callback(null, true);
      else callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
if (config.node_env === "development") app.use(morgan("dev"));

// ── IMPORTANT: Payment routes are mounted BEFORE express.json() ───────────────
// The Stripe webhook endpoint (/api/v1/payment/webhook) requires the raw
// request body to verify the Stripe-Signature header. It applies
// express.raw() internally so only that one route gets raw bytes.
// All other payment routes (checkout, verify) are parsed normally by the
// express.json() below.
app.use("/api/v1/payment", paymentRoutes);

// ── Body parser (all remaining routes get parsed JSON) ────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MelodyMasters API is healthy 🎵",
    timestamp: new Date().toISOString(),
    environment: config.node_env,
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/selectedClasses", selectedClassRoutes);
app.use("/api/v1/enrolledUsers", enrolledUserRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(
    new AppError(
      `Cannot find ${req.method} ${req.originalUrl} on this server.`,
      404,
    ),
  );
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(globalErrorHandler);

export default app;
