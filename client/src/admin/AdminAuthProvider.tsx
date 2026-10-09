import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

export type AdminRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

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

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: [
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
  ],
  ADMIN: [
    "content.read",
    "content.write",
    "contact.read",
    "contact.write",
    "payments.read",
    "payments.write",
    "payments.export",
    "audit.read",
    "users.manage",
  ],
  EDITOR: ["content.read", "content.write", "contact.read"],
  VIEWER: ["content.read", "contact.read"],
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ authenticated: boolean; admin?: AdminUser }>("/auth/session");
      setAdmin(data.authenticated && data.admin ? data.admin : null);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ admin: AdminUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setAdmin(null);
    }
  }, []);

  const can = useCallback(
    (permission: Permission) => (admin ? ROLE_PERMISSIONS[admin.role].includes(permission) : false),
    [admin],
  );

  const value = useMemo(
    () => ({ admin, loading, login, logout, refresh, can }),
    [admin, loading, login, logout, refresh, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
