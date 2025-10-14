import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const TZ = 'Asia/Yekaterinburg'

export function getDateRange(dates) {
    const now = dayjs().tz(TZ)

    // --- custom: week / month / quarter ---
    if (dates.custom) {
        const presets = { week: 7, month: 30, quarter: 90 }
        const days = presets[dates.custom]

        if (days) {
            const from = now.subtract(days - 1, 'day').startOf('day').toDate()
            const to = now.endOf('day').toDate()
            console.log({ processedAt: { gte: from, lte: to } });

            return { processedAt: { gte: from, lte: to } } // <--- всегда ключ processedAt
        }
    }

    // --- from / to ---
    if (dates.from || dates.to) {
        const from = dates.from ? dayjs(dates.from, 'DD.MM.YYYY').startOf('day').toDate() : undefined
        const to = dates.to ? dayjs(dates.to, 'DD.MM.YYYY').endOf('day').toDate() : undefined
        console.log({ processedAt: { gte: from, lte: to } });

        if (from && to) return { processedAt: { gte: from, lte: to } }
        if (from) return { processedAt: { gte: from } }
        if (to) return { processedAt: { lte: to } }
    }

    return null
}
