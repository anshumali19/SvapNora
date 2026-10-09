process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??=
  "postgresql://svapnora:svapnora@localhost:5432/svapnora?schema=public";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-1234";
process.env.COOKIE_SECURE = "false";
process.env.PAYMENT_PROVIDER ??= "none";
