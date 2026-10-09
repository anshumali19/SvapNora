import fs from "fs";
import path from "path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./env";
import { logger } from "./logger";
import { attachAdmin, attachUser } from "./middleware/auth";
import { verifyCsrf } from "./middleware/csrf";
import { apiLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { accountRouter } from "./routes/account";
import { contactRouter } from "./routes/contact";
import { contentRouter } from "./routes/content";
import { adminRouter } from "./routes/admin";
import { webhookRouter } from "./routes/webhooks";
import { seoRouter } from "./routes/seo";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(pinoHttp({ logger, autoLogging: !env.isTest }));

  // Payment webhooks need the raw body for signature verification, so they are
  // mounted before the JSON body parser.
  app.use("/api/webhooks", express.raw({ type: "*/*", limit: "1mb" }), webhookRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(attachAdmin);
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "svapnora-api", time: new Date().toISOString() });
  });

  // SEO endpoints served from the API origin.
  app.use(seoRouter);

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/account", verifyCsrf, accountRouter);
  app.use("/api/contact", contactRouter);
  app.use("/api/content", contentRouter);
  app.use("/api/admin", verifyCsrf, adminRouter);

  // In production, optionally serve the built client (SPA) from the same origin.
  if (env.isProduction) {
    const clientDist = path.resolve(__dirname, "../../client/dist");
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist, { maxAge: "1h", index: false }));
      app.get("*", (req, res, next) => {
        if (
          req.path.startsWith("/api") ||
          req.path === "/robots.txt" ||
          req.path === "/sitemap.xml"
        ) {
          return next();
        }
        res.sendFile(path.join(clientDist, "index.html"));
      });
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
