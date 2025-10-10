import axios from 'axios'
import prisma from '../config/db.js'

export async function loadReceiptsForPeriod(beginDate, endDate) {
    const AQSI_URL = process.env.AQSI_URL
    const AQSI_KEY = process.env.AQSI_KEY

    let page = 0
    let hasReceipts = false

    await prisma.nativeReceipt.deleteMany()
    const tz = 'Asia/Yekaterinburg';

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
                    console.log(r.processedAt);
                    let test = dateWithoutTZ(new Date(r.processedAt))
                    console.log(test);


                    return {
                        id: r.id, // сохраняем настоящий id от Aqsi
                        raw: r,
                        processedAt: new Date(r.processedAt)
                    }
                }),
            })

            hasReceipts = true
        }

        console.log(`Загружена страница ${page}, новых чеков: ${newReceipts.length}`)

        if (data.pages && page >= data.pages) break
        if (!newReceipts?.length) break;
        if (page > 5) break;
        page++
    }

    return hasReceipts
}

function dateWithoutTZ(date) {
    console.log(typeof date);

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    );
}
