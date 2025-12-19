import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import isoWeek from 'dayjs/plugin/isoWeek.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

const TZ = 'Asia/Yekaterinburg'

export function getDateRange(dates) {
    const now = dayjs().tz(TZ)

    // --- custom: week / month / quarter ---
    if (dates.custom) {
        if (dates.custom === 'week') {
            // Неделя: с понедельника текущей недели до сегодня
            const from = now.startOf('isoWeek').startOf('day').toDate() // Понедельник текущей недели
            const to = now.endOf('day').toDate() // Сегодня
            return { processedAt: { gte: from, lte: to } }
        }

        if (dates.custom === 'month') {
            // Месяц: с 1 числа текущего месяца до сегодня
            const from = now.startOf('month').startOf('day').toDate() // 1 число текущего месяца
            const to = now.endOf('day').toDate() // Сегодня
            return { processedAt: { gte: from, lte: to } }
        }

        if (dates.custom === 'quarter') {
            // Квартал: с начала текущего квартала до сегодня
            // Вычисляем начало квартала вручную (dayjs startOf('quarter') работает некорректно)
            const month = now.month() // 0-11 (январь = 0, декабрь = 11)
            const quarterStartMonth = Math.floor(month / 3) * 3 // 0, 3, 6, или 9
            const quarterStart = now.month(quarterStartMonth).startOf('month').startOf('day').toDate()
            const to = now.endOf('day').toDate()
            return { processedAt: { gte: quarterStart, lte: to } }
        }
    }

    // --- from / to ---
    if (dates.from || dates.to) {
        const from = dates.from
            ? dayjs.tz(dates.from, 'DD.MM.YYYY', TZ).startOf('day').toDate()
            : undefined
        const to = dates.to
            ? dayjs.tz(dates.to, 'DD.MM.YYYY', TZ).endOf('day').toDate()
            : undefined

        if (from && to) return { processedAt: { gte: from, lte: to } }
        if (from) return { processedAt: { gte: from } }
        if (to) return { processedAt: { lte: to } }
    }

    return null
}
