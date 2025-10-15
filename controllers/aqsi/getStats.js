import qs from 'qs'
import { calculateStats } from '../../functions/calculateStats.js'

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
