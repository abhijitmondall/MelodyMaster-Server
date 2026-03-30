// Must register BEFORE any async code
process.on("uncaughtException", (err: Error) => {
  console.error("💥 Uncaught Exception! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

import app from "./app.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma");

    const server = app.listen(config.port, () => {
      console.log(
        `🎵 MelodyMasters API running on port ${config.port} [${config.node_env}]`,
      );
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received — shutting down gracefully…`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("🔌 Database disconnected. Process terminated.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));

    // ── Unhandled promise rejection ──────────────────────────────────────────
    process.on("unhandledRejection", (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("💥 Unhandled Rejection! Shutting down...");
      console.error(error.name, error.message);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(1);
      });
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

void startServer();
