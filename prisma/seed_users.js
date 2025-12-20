import prisma from "../config/db.js";
import bcrypt from "bcrypt";

const users = [
    { username: "admin", password: "1234", name: 'Админ', role: "admin" },
    { username: "customer", password: "1111", name: 'Гость', role: "user" },
    { username: "nikita", password: "Monako0073", name: 'Никита Д.', role: "admin" },
    { username: "sergey", password: "Pixel_Creature_Kenia", name: 'Сергей Г.', role: "admin" },
    { username: "ulyana", password: "I7_angel", name: 'Ульяна Ф.', role: "admin" },
];

async function main() {
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.upsert({
            where: { username: user.username },
            update: {
                password: hashedPassword,
                name: user.name,
                role: user.role
            },
            create: { ...user, password: hashedPassword },
        });
    }

    console.log("✅ Пользователи добавлены/обновлены.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
