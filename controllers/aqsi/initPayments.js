import axios from 'axios';
import prisma from '../../config/db.js';
import { mapRowToMinimal } from '../../utils/mapRecieptToMinimal.js';
import { uploadReceipts } from './uploadReceipts.js';

// Загрузка чеков за период beginDate → endDate
async function loadReceiptsForPeriod(beginDate, endDate) {
    const AQSI_URL = process.env.AQSI_URL;
    const AQSI_KEY = process.env.AQSI_KEY;
    const pageSize = 10; // фиксируем 10

    let page = 1;
    let hasReceipts = false;

    // while (true) {${JSON.stringify([{ id: 'processedAt', desc: false }])
    const queryString = `?page=1&pageSize=10&filtered.beginDate=2025-10-06T00:00:00&sorted.id=${JSON.stringify([{ id: 'processedAt', desc: false }])}`
    console.log('>>> AQSI запрос:', queryString);

    const response = await axios.get(`${AQSI_URL}/v2/Receipts${queryString}`, {
        headers: { 'x-client-key': `Application ${AQSI_KEY}` }
    });

    const data = response.data;

    // console.log('typeof processedAt:', typeof data.rows[0].processedAt, data.rows[0].processedAt);

    // data.rows.forEach(row => {
    //     console.log(`Хавка ${row.content.positions[0].text} дата ${row.processedAt}`);
    //     console.log('Оригинал processedAt:', row.processedAt);
    //     console.log('После mapRowToMinimal:', mapRowToMinimal(row).processedAt);
    // })

    // if (!data.rows || data.rows.length === 0) break;

    const minimalReceipts = data.rows.map(mapRowToMinimal) || [];

    await prisma.receipt.createMany({ data: minimalReceipts });
    // Сохраняем только новые
    // const existingIds = new Set((await prisma.receipt.findMany({ select: { id: true } })).map(r => r.id));
    // const newReceipts = minimalReceipts.filter(r => !existingIds.has(r.id));

    // if (newReceipts.length > 0) {
    //     await prisma.receipt.createMany({ data: newReceipts });
    //     hasReceipts = true;
    // }

    console.log(`Загружена страница ${page}, новых чеков: ${minimalReceipts.length}`);
    // page += 1;
    // if (page > (data.pages || page)) break;
    // }

    return hasReceipts;
}


// Основная функция: идём назад по 2 месяца
export async function seedAllReceipts() {
    await prisma.receipt.deleteMany();
    await loadReceiptsForPeriod()
    //     const count = await prisma.receipt.count();

    //     if (count > 0) {
    //         console.log('Чеки уже есть в БД, пропускаем seed');
    //         setInterval(() => {
    //             uploadReceipts();
    //         }, 30 * 1000);
    //         return;
    //     }

    //     console.log('База пустая, начинаем загрузку всех чеков из Aqsi...');

    //     // Конец завтрашнего дня, чтобы точно захватить сегодняшний
    //     let currentEndDate = new Date();
    //     currentEndDate.setDate(currentEndDate.getDate() + 1);
    //     currentEndDate.setHours(23, 59, 59, 999);

    //     const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;

    //     while (true) {
    //         const currentBeginDate = new Date(currentEndDate.getTime() - twoMonthsMs);

    //         const hasData = await loadReceiptsForPeriod(currentBeginDate, currentEndDate);

    //         if (!hasData) break;

    //         currentEndDate = currentBeginDate;
    //     }

    //     console.log('Все доступные чеки загружены!');

    //     // 3️⃣ Запуск каждые 30 секунд
    //     // setInterval(() => {
    //     //     uploadReceipts();
    //     // }, 30 * 1000);
}