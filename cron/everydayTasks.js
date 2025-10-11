import cron from 'node-cron'
import prisma from '../config/db.js'
import { updateDailyTasks } from '../functions/updateDailyTasks.js'

// ===== Cron задача для ежедневного обновления =====
// Челябинск = UTC+5 → 00:00 по Челябинску = 19:00 UTC
cron.schedule('0 0 * * *', async () => {
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
