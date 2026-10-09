import { apiRequest } from "./api";

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD";

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  company: string | null;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface ClientProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: AccountUser;
  csrfToken: string;
}

export const accountApi = {
  session: () => apiRequest<SessionResponse>("/account/session"),

  register: (body: { name: string; email: string; password: string; company?: string; consent: true }) =>
    apiRequest<{
      registered: boolean;
      verificationRequired: boolean;
      verificationSent: boolean;
      authenticated: boolean;
      user?: AccountUser;
    }>("/account/register", { method: "POST", body }),

  login: (email: string, password: string) =>
    apiRequest<{ authenticated: boolean; user: AccountUser }>("/account/login", {
      method: "POST",
      body: { email, password },
    }),

  logout: () => apiRequest<{ ok: boolean }>("/account/logout", { method: "POST" }),

  me: () => apiRequest<{ user: AccountUser; projects: ClientProject[] }>("/account/me"),

  updateProfile: (body: { name?: string; company?: string | null }) =>
    apiRequest<{ user: AccountUser }>("/account/me", { method: "PATCH", body }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ ok: boolean }>("/account/change-password", { method: "POST", body }),

  verifyEmail: (token: string) =>
    apiRequest<{ verified: boolean; user: AccountUser }>("/account/verify-email", {
      method: "POST",
      body: { token },
    }),

  resendVerification: (email: string) =>
    apiRequest<{ ok: boolean; sent: boolean; message: string }>("/account/resend-verification", {
      method: "POST",
      body: { email },
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ ok: boolean; sent: boolean; message: string }>("/account/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest<{ ok: boolean }>("/account/reset-password", {
      method: "POST",
      body: { token, password },
    }),
};
