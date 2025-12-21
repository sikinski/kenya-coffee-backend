import axios from 'axios'
import prisma from '../config/db.js'
import { sendSocketReceipt } from '../websockets/receiptWS.js';

export async function loadReceiptsForPeriod(beginDate, endDate) {
    const AQSI_URL = process.env.AQSI_URL
    const AQSI_KEY = process.env.AQSI_KEY

    let page = 0
    let hasReceipts = false

    while (true) {
        const queryString = `?page=${page}&pageSize=100&filtered.beginDate=${beginDate.toISOString()}&filtered.endDate=${endDate.toISOString()}&sorted=${encodeURIComponent(JSON.stringify([{ id: 'processedAt', desc: false }]))}`

        let response;
        try {
            response = await axios.get(`${AQSI_URL}/v2/Receipts${queryString}`, {
                headers: { 'x-client-key': `Application ${AQSI_KEY}` }
            })
        } catch (err) {
            console.error('❌ Ошибка при запросе к AQSI:', err.message);
            // Если это не последняя страница, продолжаем, иначе прерываем
            if (page === 0) {
                throw err; // Если ошибка на первой странице, пробрасываем дальше
            }
            break; // Если ошибка на последующих страницах, просто прерываем цикл
        }

        const data = response.data
        if (!data.rows || data.rows.length === 0) break

        // Проверим, какие ID уже есть (по aqsiId, так как это уникальный идентификатор от AQSI)
        const existing = await prisma.nativeReceipt.findMany({
            where: { aqsiId: { in: data.rows.map(r => r.id) } },
            select: { aqsiId: true }
        })

        const existingIds = new Set(existing.map(r => r.aqsiId).filter(Boolean))
        const newReceipts = data.rows.filter(r => !existingIds.has(r.id))

        if (newReceipts.length > 0) {
            const savingData = newReceipts.map(r => {
                return {
                    aqsiId: r.id, // сохраняем ID от AQSI в поле aqsiId
                    raw: r,
                    processedAt: new Date(r.processedAt),
                    processedAtRaw: r.processedAt,
                }
            })

            await prisma.nativeReceipt.createMany({
                data: savingData
            })

            sendSocketReceipt(savingData)
            hasReceipts = true
        }

        if (data.pages && page >= data.pages) break
        if (!newReceipts?.length) break;
        page++
    }

    return hasReceipts
}

