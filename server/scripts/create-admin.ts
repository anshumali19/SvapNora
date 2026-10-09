import { z } from "zod";
import { prisma } from "../src/db";
import { env } from "../src/env";
import { hashPassword } from "../src/services/authService";

/**
 * Provision the initial administrator from ADMIN_* environment variables.
 *
 * Designed to be safe to run on every deploy (e.g. Render's free tier has no
 * shell access): if the account already exists it is left untouched unless the
 * `--force` flag is passed, and if provisioning values are not configured the
 * script exits successfully without failing the deployment.
 *
 * Usage:
 *   npm run admin:create            # create only if missing
 *   npm run admin:create -- --force # also update name/password/role
 */
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(10, "Password must be at least 10 characters"),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]),
});

async function main() {
  const force = process.argv.includes("--force");

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log(
      "Admin provisioning skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create an administrator.",
    );
    await prisma.$disconnect();
    return;
  }

  const parsed = schema.safeParse({
    email: env.ADMIN_EMAIL,
    name: env.ADMIN_NAME,
    password: env.ADMIN_PASSWORD,
    role: env.ADMIN_ROLE,
  });

  if (!parsed.success) {
    console.error(
      "Invalid admin provisioning values (check ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, ADMIN_ROLE):",
      parsed.error.flatten().fieldErrors,
    );
    process.exit(1);
  }

  const { email, name, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (existing && !force) {
    console.log(
      `Admin already exists: ${existing.email} (${existing.role}); leaving unchanged. Use --force to update.`,
    );
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email: normalizedEmail },
    update: { name, passwordHash, role, isActive: true },
    create: { email: normalizedEmail, name, passwordHash, role },
  });

  console.log(`Admin provisioned: ${user.email} (${user.role})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
