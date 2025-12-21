import prisma from '../config/db.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import qs from 'qs'
import { getDateRange } from '../utils/getDateRange.js'
import { parseCommaList } from '../utils/parseCommaList.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Asia/Yekaterinburg'

export async function calculateStats(request, dates) {
    const REFRESH_MINUTES = 10

    // --- Разбор query ---
    const queryString = request.raw.url.split('?')[1] || ''
    const query = qs.parse(queryString, { allowDots: true })
    const devicesParam = (parseCommaList(query.devices) || [])
        .map(sn => sn.toString().trim())
        .filter(Boolean)

    // --- Диапазон дат ---
    const range = getDateRange(dates)
    if (!range) {
        throw new Error('Не указан диапазон дат')
    }

    const from = range.processedAt.gte
    const to = range.processedAt.lte
    const now = dayjs().tz(TZ)

    // Определяем "тип периода" (для кэша)
    const period = dates.custom || 'custom'

    // --- Формируем WHERE ---
    const where = {
        processedAt: { gte: from, lte: to }
    }

    if (devicesParam.length > 0) {
        where.OR = devicesParam.map(sn => ({
            raw: {
                path: ['deviceSN'],
                equals: sn
            }
        }))
    }

    // --- 1️⃣ Проверяем кэш ---
    const cached = await prisma.statsCache.findFirst({
        where: {
            period,
            from,
            to,
            devices: devicesParam.join(',') || null,
            createdAt: {
                gte: now.subtract(REFRESH_MINUTES, 'minute').toDate() // кэш свежий (меньше REFRESH_MINUTES минут)
            }
        }
    })

    if (cached) {
        return cached
    }

    // --- 2️⃣ Считаем заново ---
    const receipts = await prisma.nativeReceipt.findMany({
        where,
        select: { raw: true }
    })

    const revenue = calculateRevenue(receipts)
    const receiptsCount = receipts.length
    const avgCheck = receiptsCount > 0 ? Math.round(revenue / receiptsCount) : 0

    // --- Выручка за день (в timezone Asia/Yekaterinburg) ---
    const dayFrom = now.startOf('day').toDate()
    const dayTo = now.endOf('day').toDate()

    const dayWhere = {
        processedAt: { gte: dayFrom, lte: dayTo }
    }

    if (devicesParam.length > 0) {
        dayWhere.OR = devicesParam.map(sn => ({
            raw: {
                path: ['deviceSN'],
                equals: sn
            }
        }))
    }

    const dayReceipts = await prisma.nativeReceipt.findMany({
        where: dayWhere,
        select: { raw: true }
    })

    const dayRevenue = calculateRevenue(dayReceipts)

    const result = {
        period,
        from,
        to,
        revenue,
        avgCheck,
        receiptsCount,
        dayRevenue,
        devices: devicesParam.join(',') || null
    }

    // --- 3️⃣ Сохраняем в кэш ---
    await prisma.statsCache.create({ data: result })

    console.log('💾 Кэш обновлён')

    return result
}

function calculateRevenue(receipts) {
    return Math.round(receipts.reduce((sum, r) => {
        const amount = Number(r.raw?.amount) || 0;
        const type = r.raw?.content?.type;

        // AQSI считает только чеки типа 1 (продажи) и вычитает чеки типа 2 (возвраты)
        // Тип 1 = продажа (добавляем)
        // Тип 2 = возврат (вычитаем)
        // Остальные типы или если тип не указан (undefined/null) - не учитываем
        if (type === 1) {
            return sum + amount;
        } else if (type === 2) {
            return sum - amount; // Возвраты вычитаем
        }
        // Для других типов или если тип не указан (undefined/null), не учитываем
        return sum;
    }, 0))
}
