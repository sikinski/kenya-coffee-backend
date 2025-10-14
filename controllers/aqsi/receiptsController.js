import prisma from '../../config/db.js'
import { parseCommaList } from '../../utils/parseCommaList.js'
import { getDateRange } from '../../utils/getDateRange.js'
import qs from 'qs'

export const getReceipts = async (request, reply) => {
    try {
        // Разбираем query-параметры, чтобы точки стали вложенными объектами
        const queryString = request.raw.url.split('?')[1] || ''
        const query = qs.parse(queryString, { allowDots: true })

        const page = Number(query.page) || 1
        const page_size = Number(query.page_size) || 20
        const devicesParam = (parseCommaList(query.devices) || [])
            .map(sn => sn.toString().trim())
            .filter(Boolean)

        const skip = (page - 1) * page_size
        const take = page_size

        // --- WHERE условие ---
        const where = {}

        // Фильтр по устройствам
        if (devicesParam.length > 0) {
            where.OR = devicesParam.map(sn => ({
                raw: {
                    path: ['deviceSN'],
                    equals: sn
                }
            }))
        }

        // Фильтр по датам
        if (query.dates) {
            const range = getDateRange(query.dates)
            if (range) Object.assign(where, range)
        }

        const [receipts, total] = await Promise.all([
            prisma.nativeReceipt.findMany({
                where,
                skip,
                take,
                orderBy: { processedAt: 'desc' }
            }),
            prisma.nativeReceipt.count({ where })
        ])

        return reply.status(200).send({
            receipts: receipts || [],
            pagination: {
                page,
                page_size,
                total
            }
        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send('Не удалось получить чеки')
    }
}
