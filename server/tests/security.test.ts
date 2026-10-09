import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("admin authorization boundaries", () => {
  it("rejects unauthenticated access to the overview", async () => {
    const res = await request(app).get("/api/admin/overview");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to content management", async () => {
    const res = await request(app).get("/api/admin/content/features");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to payments", async () => {
    const res = await request(app).get("/api/admin/payments");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated admin listing", async () => {
    const res = await request(app).get("/api/admin/admins");
    expect(res.status).toBe(401);
  });

  it("rejects state-changing admin requests without a CSRF token", async () => {
    const res = await request(app)
      .post("/api/admin/content/features")
      .send({ category: "x", title: "y", description: "z" });
    expect([401, 403]).toContain(res.status);
  });
});

describe("auth session endpoints", () => {
  it("reports unauthenticated session state", async () => {
    const res = await request(app).get("/api/auth/session");
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
    expect(typeof res.body.csrfToken).toBe("string");
  });

  it("validates login input server-side", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nope", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });
});

describe("public endpoints", () => {
  it("exposes health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("returns payment provider status without secrets", async () => {
    const res = await request(app).get("/api/content/payments/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("provider");
    expect(res.body).not.toHaveProperty("secret");
  });
});
