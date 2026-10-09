import { z } from "zod";
import { prisma } from "../src/db";
import { env } from "../src/env";
import { hashPassword } from "../src/services/authService";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(10, "Password must be at least 10 characters"),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]),
});

async function main() {
  const parsed = schema.safeParse({
    email: env.ADMIN_EMAIL,
    name: env.ADMIN_NAME,
    password: env.ADMIN_PASSWORD,
    role: env.ADMIN_ROLE,
  });

  if (!parsed.success) {
    console.error(
      "Missing/invalid admin provisioning values. Set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, ADMIN_ROLE in .env",
      parsed.error.flatten().fieldErrors,
    );
    process.exit(1);
  }

  const { email, name, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);

  const user = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, role, isActive: true },
    create: { email: email.toLowerCase(), name, passwordHash, role },
  });

  console.log(`Admin provisioned: ${user.email} (${user.role})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
