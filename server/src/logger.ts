import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.isTest ? "silent" : env.isProduction ? "info" : "debug",
  base: { service: "svapnora-api" },
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "password",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.tokenHash",
    ],
    censor: "[redacted]",
  },
  transport: env.isProduction
    ? undefined
    : { target: "pino/file", options: { destination: 1 } },
});
