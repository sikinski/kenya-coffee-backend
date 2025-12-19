import cron from 'node-cron'
import prisma from '../config/db.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Asia/Yekaterinburg'

// Генерируем ежедневные задачи в 00:00 по времени Челябинска
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('🔄 Генерируем ежедневные задачи...', new Date().toISOString())

        const today = dayjs().tz(TZ).startOf('day').toDate()

        // Получаем все активные задачи
        const activeTasks = await prisma.task.findMany({
            where: { active: true },
            orderBy: { order: 'asc' }
        })

        if (activeTasks.length === 0) {
            console.log('ℹ️  Нет активных задач для создания')
            return
        }

        // Проверяем, какие задачи уже созданы на сегодня
        const existingDailyTasks = await prisma.dailyTask.findMany({
            where: { date: today },
            select: { taskId: true }
        })

        const existingTaskIds = new Set(existingDailyTasks.map(dt => dt.taskId))

        // Создаем только те задачи, которых еще нет на сегодня
        const tasksToCreate = activeTasks
            .filter(task => !existingTaskIds.has(task.id))
            .map(task => ({
                date: today,
                taskId: task.id,
                done: false
            }))

        if (tasksToCreate.length > 0) {
            await prisma.dailyTask.createMany({
                data: tasksToCreate
            })
            console.log(`✅ Создано ${tasksToCreate.length} ежедневных задач`)
        } else {
            console.log('ℹ️  Все задачи уже созданы на сегодня')
        }

    } catch (err) {
        console.error('❌ Ошибка при генерации ежедневных задач:', err)
    }
}, {
    timezone: TZ
})

console.log('📅 Cron для генерации ежедневных задач запущен (00:00 по времени Челябинска)')

