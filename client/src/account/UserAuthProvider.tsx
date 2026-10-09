import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { accountApi, type AccountUser } from "../lib/accountApi";

interface UserAuthContextValue {
  user: AccountUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: { name: string; email: string; password: string; company?: string; consent: true }) => Promise<{
    verificationRequired: boolean;
    verificationSent: boolean;
    authenticated: boolean;
  }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: AccountUser | null) => void;
}

const UserAuthContext = createContext<UserAuthContextValue | null>(null);

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await accountApi.session();
      setUser(data.authenticated && data.user ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await accountApi.login(email, password);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (body: { name: string; email: string; password: string; company?: string; consent: true }) => {
      const data = await accountApi.register(body);
      if (data.authenticated && data.user) setUser(data.user);
      return {
        verificationRequired: data.verificationRequired,
        verificationSent: data.verificationSent,
        authenticated: data.authenticated,
      };
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await accountApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh],
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUserAuth(): UserAuthContextValue {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error("useUserAuth must be used within UserAuthProvider");
  return ctx;
}
