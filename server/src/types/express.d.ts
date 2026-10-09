import type { AdminRole, AdminUser, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        user: AdminUser;
        sessionId: string;
      };
      user?: {
        user: User;
        sessionId: string;
      };
    }
  }
}

export type AuthenticatedAdmin = {
  user: AdminUser;
  sessionId: string;
};

export type AuthenticatedUser = {
  user: User;
  sessionId: string;
};

export type { AdminRole };
