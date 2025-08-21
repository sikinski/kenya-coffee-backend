import prisma from "../config/db.js";
import bcrypt from "bcrypt";

const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "customer", password: "1111", role: "user" },
];

async function main() {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, password: hashedPassword },
    });
  }

  console.log("✅ Пользователи добавлены/обновлены.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
