import axios from 'axios'
import prisma from '../config/db.js'

export async function loadReceiptsForPeriod(beginDate, endDate) {
    const AQSI_URL = process.env.AQSI_URL;
    const AQSI_KEY = process.env.AQSI_KEY;

    let page = 1;
    let hasReceipts = false;

    while (true) {
        const queryString = `?page=${page}&pageSize=10&filtered.beginDate=${beginDate.toISOString()}&filtered.endDate=${endDate.toISOString()}&sorted=${encodeURIComponent(JSON.stringify([{ id: 'processedAt', desc: false }]))}`;

        console.log('>>> AQSI запрос:', queryString);

        const response = await axios.get(`${AQSI_URL}/v2/Receipts${queryString}`, {
            headers: { 'x-client-key': `Application ${AQSI_KEY}` }
        });

        const data = response.data;

        if (!data.rows || data.rows.length === 0) break;

        /// Проверяем существующие чеки по aqsiId
        const existing = await prisma.nativeReceipt.findMany({
            where: { aqsiId: { in: data.rows.map(r => r.id) } },
            select: { aqsiId: true },
        })
        const existingIds = new Set(existing.map(r => r.aqsiId))

        const newReceipts = data.rows.filter(r => !existingIds.has(r.id))

        if (newReceipts.length > 0) {
            await prisma.nativeReceipt.createMany({
                data: newReceipts.map(r => ({
                    aqsiId: r.id, // 🔹 сохраняем aqsiId отдельно
                    raw: r,
                    processedAt: new Date(r.processedAt),
                })),
                skipDuplicates: true, // подстраховка
            })
        }

        console.log(`Загружена страница ${page}, новых чеков: ${newReceipts.length}`);

        if (data.pages && page >= data.pages) break;
        page++;
    }

    return hasReceipts;
}
