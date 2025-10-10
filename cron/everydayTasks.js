import cron from 'node-cron'
import prisma from '../config/db.js'
import tasks from '../helpers/tasksData.js'

// ===== Функция для обновления задач на день =====
async function updateDailyTasks() {
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

// ===== Cron задача для ежедневного обновления =====
// Челябинск = UTC+5 → 00:00 по Челябинску = 19:00 UTC
cron.schedule('37 12 * * *', async () => {
    console.log('🕛 Обновляем задачи на сегодня (00:00 Челябинск)')
    try {
        await updateDailyTasks()
    } catch (err) {
        console.error('❌ Ошибка при обновлении задач:', err)
    } finally {
        await prisma.$disconnect()
    }
}, {
    timezone: "Asia/Yekaterinburg" // <-- Челябинск/Екатеринбург (UTC+5)
})
