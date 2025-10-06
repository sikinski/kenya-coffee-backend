import axios from 'axios';
import prisma from '../../config/db.js';
import { mapRowToMinimal } from '../../utils/mapRecieptToMinimal.js';
import { seedAllReceipts } from './initPayments.js';

export async function uploadReceipts() {
    const AQSI_URL = process.env.AQSI_URL;
    const AQSI_KEY = process.env.AQSI_KEY;

    // 1️⃣ Находим последнюю дату чека
    const lastReceipt = await prisma.receipt.findFirst({
        orderBy: [
            { processedAt: 'desc' },
            { createdAt: 'desc' },
        ],
    });

    const pad = (n) => n.toString().padStart(2, '0');

    let beginDate;
    if (lastReceipt) {
        const d = lastReceipt.processedAt;
        beginDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } else {
        // если чеков нет
        await seedAllReceipts()
        return;
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

