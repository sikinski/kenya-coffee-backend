import prisma from '../config/db.js'
import dayjs from 'dayjs'
import qs from 'qs'
import { getDateRange } from '../utils/getDateRange.js'
import { parseCommaList } from '../utils/parseCommaList.js'

export async function calculateStats(request, dates) {
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
    const now = dayjs()

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
                gte: now.subtract(30, 'minute').toDate() // кэш свежий (меньше 30 минут)
            }
        }
    })

    if (cached) {
        console.log('✅ Возвращаю кэшированные данные')
        return cached
    }

    // --- 2️⃣ Считаем заново ---
    const receipts = await prisma.nativeReceipt.findMany({
        where,
        select: { raw: true }
    })

    const revenue = receipts.reduce((sum, r) => sum + (Number(r.raw?.amount) || 0), 0)
    const receiptsCount = receipts.length
    const avgCheck = receiptsCount > 0 ? +(revenue / receiptsCount).toFixed(2) : 0 // округляем

    // --- Выручка за день ---
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

    const dayRevenue = dayReceipts.reduce((sum, r) => sum + (Number(r.raw?.amount) || 0), 0)

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
