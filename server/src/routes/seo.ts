import { Router } from "express";
import { env } from "../env";

export const seoRouter = Router();

const PUBLIC_PATHS = [
  "/",
  "/glowlang",
  "/technology",
  "/about",
  "/roadmap",
  "/contact",
  "/pricing",
  "/privacy",
  "/terms",
];

seoRouter.get("/robots.txt", (_req, res) => {
  res
    .type("text/plain")
    .send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /admin/",
        "Disallow: /api/",
        "",
        `Sitemap: ${env.APP_ORIGIN}/sitemap.xml`,
        "",
      ].join("\n"),
    );
});

seoRouter.get("/sitemap.xml", (_req, res) => {
  const urls = PUBLIC_PATHS.map(
    (path) => `  <url><loc>${env.APP_ORIGIN}${path}</loc></url>`,
  ).join("\n");
  res.type("application/xml").send(
    [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, urls, `</urlset>`].join("\n"),
  );
});
