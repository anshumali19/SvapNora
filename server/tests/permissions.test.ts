import { describe, expect, it } from "vitest";
import { roleHasPermission, ROLE_RANK } from "../src/lib/permissions";

describe("permissions", () => {
  it("grants owners everything", () => {
    expect(roleHasPermission("OWNER", "admin.manage")).toBe(true);
    expect(roleHasPermission("OWNER", "payments.export")).toBe(true);
  });

  it("restricts viewers to read-only content and contacts", () => {
    expect(roleHasPermission("VIEWER", "content.read")).toBe(true);
    expect(roleHasPermission("VIEWER", "content.write")).toBe(false);
    expect(roleHasPermission("VIEWER", "payments.read")).toBe(false);
    expect(roleHasPermission("VIEWER", "admin.manage")).toBe(false);
  });

  it("allows editors to write content but not manage payments or admins", () => {
    expect(roleHasPermission("EDITOR", "content.write")).toBe(true);
    expect(roleHasPermission("EDITOR", "payments.read")).toBe(false);
    expect(roleHasPermission("EDITOR", "admin.manage")).toBe(false);
  });

  it("orders roles by authority", () => {
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.ADMIN);
    expect(ROLE_RANK.ADMIN).toBeGreaterThan(ROLE_RANK.EDITOR);
    expect(ROLE_RANK.EDITOR).toBeGreaterThan(ROLE_RANK.VIEWER);
  });
});
