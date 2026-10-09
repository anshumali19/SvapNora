import type { AdminRole } from "@prisma/client";

export type Permission =
  | "content.read"
  | "content.write"
  | "contact.read"
  | "contact.write"
  | "payments.read"
  | "payments.write"
  | "payments.export"
  | "audit.read"
  | "users.manage"
  | "admin.manage";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  OWNER: new Set<Permission>([
    "content.read",
    "content.write",
    "contact.read",
    "contact.write",
    "payments.read",
    "payments.write",
    "payments.export",
    "audit.read",
    "users.manage",
    "admin.manage",
  ]),
  ADMIN: new Set<Permission>([
    "content.read",
    "content.write",
    "contact.read",
    "contact.write",
    "payments.read",
    "payments.write",
    "payments.export",
    "audit.read",
    "users.manage",
  ]),
  EDITOR: new Set<Permission>(["content.read", "content.write", "contact.read"]),
  VIEWER: new Set<Permission>(["content.read", "contact.read"]),
};

export function roleHasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export const ROLE_RANK: Record<AdminRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};
