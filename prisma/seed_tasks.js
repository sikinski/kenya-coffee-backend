import prisma from "../config/db.js";
import tasks from '../helpers/tasksData.js'

async function main() {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // 🧹 Удаляем все задачи за сегодня
    await prisma.dailyTask.deleteMany({
        where: {
            date: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        },
    })

    // ✅ Добавляем новые задачи
    for (const task of tasks) {
        await prisma.dailyTask.create({
            data: {
                ...task,
                date: today,
                done: false,
            },
        })
    }

    console.log("✅ Задачи добавлены на сегодня.")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
