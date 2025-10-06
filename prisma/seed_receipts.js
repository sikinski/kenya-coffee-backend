import axios from 'axios'
import prisma from "../config/db.js";

async function main() {
    await prisma.nativeReceipt.deleteMany();

    const count = await prisma.nativeReceipt.count();

    if (count > 0) {
        console.log('Чеки уже есть в БД, пропускаем seed');
        return;
    }

    // Конец завтрашнего дня, чтобы точно захватить сегодняшний
    let currentEndDate = new Date();
    currentEndDate.setDate(currentEndDate.getDate() + 1);
    currentEndDate.setHours(23, 59, 59, 999);

    const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;

    while (true) {
        const currentBeginDate = new Date(currentEndDate.getTime() - twoMonthsMs);
        const hasData = await loadReceiptsForPeriod(currentBeginDate, currentEndDate);
        if (!hasData) break;
        currentEndDate = currentBeginDate;
    }

    console.log("✅ Чеки добавлены за все время.");
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    prisma.$disconnect();
});

async function loadReceiptsForPeriod(beginDate, endDate) {
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

        // // Проверим, какие ID уже есть
        // const existing = await prisma.nativeReceipt.findMany({
        //     where: { id: { in: data.rows.map(r => r.id) } },
        //     select: { id: true }
        // });

        // const existingIds = new Set(existing.map(r => r.id));
        // const newReceipts = data.rows.filter(r => !existingIds.has(r.id));

        if (data.rows.length > 0) {
            await prisma.nativeReceipt.createMany({
                data: data.rows.map(r => ({
                    raw: r,
                    processedAt: new Date(r.processedAt),
                })),
            });

            hasReceipts = true;
        }

        console.log(`Загружена страница ${page}, новых чеков: ${data.rows.length}`);

        if (data.pages && page >= data.pages) break;
        if (page > 10) break;
        page++;
    }

    return hasReceipts;
}
