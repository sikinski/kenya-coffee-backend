import moment from 'moment-timezone'
import prisma from '../config/db.js'

const TZ = 'Asia/Yekaterinburg'

export async function ensureTodayReport() {
    // Сегодня 00:00 по Челябинску
    let today = moment.tz(TZ).startOf('day')

    // Конвертируем в JS Date
    let todayDate = today.toDate()

    // Проверка: если при toDate() получилось 19:00:00 (UTC), прибавляем 5 часов
    const formatTime = (date) => date.toISOString().substr(11, 8) // HH:mm:ss
    if (formatTime(todayDate) === '19:00:00') {
        todayDate = new Date(todayDate.getTime() + 5 * 60 * 60 * 1000)
    }

    // Проверяем, есть ли уже отчёт на сегодня
    const existing = await prisma.report.findFirst({
        where: { date: todayDate }
    })

    if (!existing) {
        await prisma.report.create({
            data: {
                date: todayDate,
                cash: null,
                non_cash: null,
                total: null,
                number_purchases: null,
                cash_register: null
            }
        })
        console.log("✅ Создан пустой отчёт на сегодня.")
    } else {
        console.log("ℹ️ Отчёт на сегодня уже существует, пропускаем.")
    }
}
