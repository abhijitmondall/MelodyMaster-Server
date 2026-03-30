import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  node_env: process.env["NODE_ENV"] ?? "development",
  port: process.env["PORT"] ?? "3000",
  database_url: process.env["DATABASE_URL"] ?? "",

  // Access token — short-lived (default 15m)
  jwt_secret: process.env["JWT_SECRET"] ?? "",
  jwt_expires_in: process.env["JWT_EXPIRES_IN"] ?? "15m",

  // Refresh token — long-lived (default 7d)
  jwt_refresh_secret: process.env["JWT_REFRESH_SECRET"] ?? "",
  jwt_refresh_expires_in: process.env["JWT_REFRESH_EXPIRES_IN"] ?? "7d",
  refresh_token_ttl_ms: parseInt(
    process.env["REFRESH_TOKEN_TTL_MS"] ?? String(7 * 24 * 60 * 60 * 1000),
  ),

  // Stripe
  payment_secret_key: process.env["PAYMENT_SECRET_KEY"] ?? "",
  stripe_webhook_secret: process.env["STRIPE_WEBHOOK_SECRET"] ?? "",

  // Frontend URL for Stripe redirect
  frontend_url: process.env["FRONTEND_URL"] ?? "http://localhost:3000",

  allowed_origins: process.env["ALLOWED_ORIGINS"]
    ? process.env["ALLOWED_ORIGINS"].split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"],
} as const;

export default config;
