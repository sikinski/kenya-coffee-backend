import axios from 'axios';
import prisma from '../../config/db.js';
import { mapRowToMinimal } from '../../utils/mapRecieptToMinimal.js';

export async function uploadReceipts() {
    const latestReceipt = await prisma.receipt.findFirst({
        orderBy: [
            { processedAt: 'desc' },
            { createdAt: 'desc' },
        ],
    });

    const AQSI_URL = process.env.AQSI_URL;
    const AQSI_KEY = process.env.AQSI_KEY;

    // 1️⃣ Находим последнюю дату чека
    const lastReceipt = await prisma.receipt.findFirst({
        orderBy: { processedAt: 'desc' },
    });

    const pad = (n) => n.toString().padStart(2, '0');

    let beginDate;
    if (lastReceipt) {
        const d = lastReceipt.processedAt;
        beginDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } else {
        // если чеков нет, берём 3 месяца назад
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        beginDate = `${threeMonthsAgo.getFullYear()}-${pad(threeMonthsAgo.getMonth() + 1)}-${pad(threeMonthsAgo.getDate())}T${pad(threeMonthsAgo.getHours())}:${pad(threeMonthsAgo.getMinutes())}:${pad(threeMonthsAgo.getSeconds())}`;
    }

    // 2️⃣ Запрос к Aqsi
    const page = 1;
    const pageSize = 100;
    const query = `page=${page}&pageSize=${pageSize}&filtered.beginDate=${beginDate}`;

    try {
        const response = await axios.get(`${AQSI_URL}/v2/Receipts?${query}`, {
            headers: { 'x-client-key': `Application ${AQSI_KEY}` },
        });

        if (!response.data.rows || response.data.rows.length === 0) return;

        const minimalReceipts = response.data.rows.map(mapRowToMinimal) || [];

        for (const r of minimalReceipts) {
            await prisma.receipt.upsert({
                where: { id: r.id },
                update: r,
                create: r,
            });
        }

        console.log(`Обновлено чеков: ${minimalReceipts?.length}`);
    } catch (err) {
        console.error('Ошибка при обновлении новых чеков:', err.response?.data || err.message);
    }
}

// 3️⃣ Запуск каждые 30 секунд
setInterval(() => {
    uploadReceipts();
}, 30 * 1000);
