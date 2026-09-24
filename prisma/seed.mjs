import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL || "admin@portfolio.local").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "Admin123!";
const name = process.env.ADMIN_NAME || "Super Admin";

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log(`Super admin déjà présent : ${email}`);
} else {
  await prisma.user.create({
    data: {
      email,
      role: "SUPER_ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
      profile: { create: { fullName: name, slug: "super-admin" } },
    },
  });
  console.log(`Super admin créé : ${email} / ${password}`);
}
await prisma.$disconnect();
