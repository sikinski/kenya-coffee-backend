import axios from 'axios'
import prisma from '../config/db.js'

export async function loadReceiptsForPeriod(beginDate, endDate) {
    const AQSI_URL = process.env.AQSI_URL
    const AQSI_KEY = process.env.AQSI_KEY

    let page = 0
    let hasReceipts = false

    while (true) {
        const queryString = `?page=${page}&pageSize=50&filtered.beginDate=${beginDate.toISOString()}&filtered.endDate=${endDate.toISOString()}&sorted=${encodeURIComponent(JSON.stringify([{ id: 'processedAt', desc: false }]))}`

        console.log('>>> AQSI запрос:', queryString)

        const response = await axios.get(`${AQSI_URL}/v2/Receipts${queryString}`, {
            headers: { 'x-client-key': `Application ${AQSI_KEY}` }
        })

        const data = response.data
        if (!data.rows || data.rows.length === 0) break

        // Проверим, какие ID уже есть
        const existing = await prisma.nativeReceipt.findMany({
            where: { id: { in: data.rows.map(r => r.id) } },
            select: { id: true }
        })
        const existingIds = new Set(existing.map(r => r.id))
        const newReceipts = data.rows.filter(r => !existingIds.has(r.id))

        if (newReceipts.length > 0) {
            await prisma.nativeReceipt.createMany({
                data: newReceipts.map(r => {
                    // === Обработка processedAt ===
                    const tz = 'Asia/Yekaterinburg';
                    // let processedAtDate

                    // if (r.processedAt.endsWith('Z') || r.processedAt.includes('+') || r.processedAt.includes('-')) {
                    //     // Если строка уже с таймзоной, JS корректно распарсит
                    //     processedAtDate = new Date(r.processedAt).toLocaleString('ru-RU', { timeZone: tz })
                    // } else {
                    //     // Если без таймзоны — считаем как UTC
                    //     processedAtDate = new Date(r.processedAt + 'Z').toLocaleString('ru-RU', { timeZone: tz })
                    // }

                    return {
                        id: r.id, // сохраняем настоящий id от Aqsi
                        raw: r,
                        processedAt: new Date(r.processedAt).toLocaleString('ru-RU', { timeZone: tz }),
                    }
                }),
            })

            hasReceipts = true
        }

        console.log(`Загружена страница ${page}, новых чеков: ${newReceipts.length}`)

        if (data.pages && page >= data.pages) break
        if (!newReceipts?.length) break;
        page++
    }

    return hasReceipts
}
