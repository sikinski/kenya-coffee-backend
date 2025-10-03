import axios from 'axios';
import prisma from '../../config/db.js';
import { mapRowToMinimal } from '../../utils/mapRecieptToMinimal.js';

// Часовой пояс, например +5 (Челябинск)
const TIMEZONE_OFFSET = 5 * 60; // минуты

// Форматируем дату под AQSI (UTC+5)
function formatDateISO(date) {
    const local = new Date(date.getTime() + TIMEZONE_OFFSET * 60000);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`;
}

// Загрузка чеков за период beginDate → endDate
async function loadReceiptsForPeriod(beginDate, endDate) {
    const AQSI_URL = process.env.AQSI_URL;
    const AQSI_KEY = process.env.AQSI_KEY;
    const pageSize = 10; // фиксируем 10

    let page = 1;
    let hasReceipts = false;

    while (true) {
        const url = `${AQSI_URL}/v2/Receipts?page=${page}&pageSize=${pageSize}&filtered.beginDate=${formatDateISO(beginDate)}&filtered.endDate=${formatDateISO(endDate)}`;
        console.log('>>> AQSI запрос:', url);

        const response = await axios.get(url, {
            headers: { 'x-client-key': `Application ${AQSI_KEY}` }
        });

        const data = response.data;
        if (!data.rows || data.rows.length === 0) break;

        const minimalReceipts = data.rows.map(mapRowToMinimal) || [];

        // Сохраняем только новые
        const existingIds = new Set((await prisma.receipt.findMany({ select: { id: true } })).map(r => r.id));
        const newReceipts = minimalReceipts.filter(r => !existingIds.has(r.id));

        if (newReceipts.length > 0) {
            await prisma.receipt.createMany({ data: newReceipts, skipDuplicates: true });
            hasReceipts = true;
        }

        console.log(`Загружена страница ${page}, новых чеков: ${newReceipts.length}`);
        page += 1;
        if (page > (data.pages || page)) break;
    }

    return hasReceipts;
}

// Основная функция: идём назад по 2 месяца
export async function seedAllReceipts() {
    await prisma.receipt.deleteMany();
    const count = await prisma.receipt.count();

    if (count > 0) {
        console.log('Чеки уже есть в БД, пропускаем seed');
        return;
    }

    console.log('База пустая, начинаем загрузку всех чеков из Aqsi...');

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

    console.log('Все доступные чеки загружены!');
}
