const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.setting.findUnique({ where: { key: "systemPrompt" } });
  if (!existing) {
    await prisma.setting.create({
      data: {
        key: "systemPrompt",
        value:
          "You are a helpful assistant for this business. Answer questions using the provided knowledge base context when relevant. If you don't know something, say so honestly instead of guessing.",
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "ADMIN",
        plan: "PRO",
      },
    });
    console.log(`Seeded admin user: ${adminEmail} / ${adminPassword}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
