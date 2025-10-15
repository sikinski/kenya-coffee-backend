import qs from 'qs'
import { calculateStats } from '../../functions/calculateStats.js'
import prisma from '../../config/db.js'

export const getStats = async (request, reply) => {
    try {
        const queryString = request.raw.url.split('?')[1] || ''
        const query = qs.parse(queryString, { allowDots: true })

        const stats = await calculateStats(request, query.dates)
        return reply.status(200).send(stats)
    } catch (err) {
        console.error(err)
        return reply.status(500).send('Не удалось получить статистику')
    }
}

export const resetStats = async (request, reply) => {
    try {
        await prisma.statsCache.deleteMany()
        return reply.status(200).send('Кэш сброшен')
    } catch {
        console.error(err)
        return reply.status(500).send('Не получилось сбросить кэш')
    }
}