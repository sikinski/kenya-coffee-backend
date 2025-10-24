

import cron from 'node-cron'
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';
import prisma from '../config/db.js'

// ====== CRON
cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Загружаем чеки. С нуля', new Date().toISOString());

    await prisma.nativeReceipt.deleteMany();

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
})