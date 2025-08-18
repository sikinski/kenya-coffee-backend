import pkg from "@prisma/client";
const { PrismaClient } = pkg; 
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();

  const users = [
    { username: "admin", password: "1234", role: "admin" },
    { username: "customer", password: "1111", role: "user" },
    { username: "manager", password: "secret", role: "admin" },
    { username: "barista", password: "coffee", role: "user" },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({ data: { ...user, password: hashedPassword } });
  }

  console.log("✅ Seed выполнен! Пользователи созданы.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
