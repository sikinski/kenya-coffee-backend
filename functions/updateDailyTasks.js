import moment from 'moment-timezone'
import prisma from '../config/db.js'
import tasks from '../helpers/tasksData.js'

const TZ = 'Asia/Yekaterinburg'

export async function updateDailyTasks() {
    // Сегодня 00:00 по Челябинску
    let today = moment.tz(TZ).startOf('day')
    let tomorrow = moment(today).add(1, 'day')

    // Конвертируем в JS Date
    let todayDate = today.toDate()
    let tomorrowDate = tomorrow.toDate()

    // Проверка: если при toDate() получилось 19:00:00 (UTC), прибавляем 5 часов
    const formatTime = (date) =>
        date.toISOString().substr(11, 8) // HH:mm:ss

    if (formatTime(todayDate) === '19:00:00') {
        todayDate = new Date(todayDate.getTime() + 5 * 60 * 60 * 1000)
        tomorrowDate = new Date(tomorrowDate.getTime() + 5 * 60 * 60 * 1000)
    }

    console.log('Today:', todayDate.toISOString())
    console.log('Tomorrow:', tomorrowDate.toISOString())

    // 🧹 Удаляем все задачи за сегодня
    await prisma.dailyTask.deleteMany({
        where: {
            date: {
                gte: todayDate,
                lt: tomorrowDate,
            },
        },
    })

    // ✅ Добавляем все задачи за один запрос
    const tasksToCreate = tasks.map(task => ({
        text: task.text,
        date: today,
        done: false,
    }))

    await prisma.dailyTask.createMany({
        data: tasksToCreate,
        skipDuplicates: true, // на случай если вдруг дубли есть
    })

    console.log("✅ Задачи добавлены на сегодня.")
}
