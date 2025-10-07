import cron from 'node-cron'
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';
import prisma from '../config/db.js'

cron.schedule('* * * * *', async () => {
    console.log('🔄 Обновляем чеки Aqsi...')

    // ====== DATE
    let currentEndDate = new Date();
    let currentBeginDate;
    const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;

    currentEndDate.setDate(currentEndDate.getDate() + 1);
    currentEndDate.setHours(23, 59, 59, 999);

    const last = await prisma.nativeReceipt.findFirst({
        orderBy: { processedAt: 'desc' },
    })
    currentBeginDate = last ? last.processedAt : new Date(currentEndDate.getTime() - twoMonthsMs);
    // ======

    try {
        loadReceiptsForPeriod(currentBeginDate, currentEndDate)
    } catch (err) {
        console.error('❌ Ошибка при обновлении чеков:', err)
    }
})

