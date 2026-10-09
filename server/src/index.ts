import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./db";
import { purgeExpiredSessions } from "./services/authService";
import { purgeExpiredUserArtifacts } from "./services/userAuthService";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, appOrigin: env.APP_ORIGIN },
    "SvapNora API listening",
  );
});

const purgeInterval = setInterval(
  () => {
    purgeExpiredSessions()
      .then((count) => {
        if (count > 0) logger.info({ count }, "purged expired sessions");
      })
      .catch((err) => logger.error({ err }, "session purge failed"));
    purgeExpiredUserArtifacts()
      .then(({ sessions, tokens }) => {
        if (sessions > 0 || tokens > 0) {
          logger.info({ sessions, tokens }, "purged expired user sessions/tokens");
        }
      })
      .catch((err) => logger.error({ err }, "user artifact purge failed"));
  },
  60 * 60 * 1000,
);

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  clearInterval(purgeInterval);
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
