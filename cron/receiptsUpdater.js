import cron from 'node-cron'
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';
import prisma from '../config/db.js'

// ====== CRON
cron.schedule('* * * * *', async () => {
    console.log('🔄 Обновляем чеки Aqsi...', new Date().toISOString());

    let currentEndDate = new Date();
    currentEndDate.setDate(currentEndDate.getDate() + 2);
    currentEndDate.setHours(23, 59, 59, 999);

    let currentBeginDate;

    const last = await prisma.nativeReceipt.findFirst({
        orderBy: { processedAt: 'desc' },
    })

    if (last) {
        const lastDate = new Date(last.processedAt);
        lastDate.setHours(0, 0, 0, 0);
        currentBeginDate = new Date(lastDate.getTime() - 5 * 60 * 60 * 1000);
    } else {
        const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;
        currentBeginDate = new Date(currentEndDate.getTime() - twoMonthsMs);
    }

    try {
        await loadReceiptsForPeriod(currentBeginDate, currentEndDate)
    } catch (err) {
        console.error('❌ Ошибка при обновлении чеков:', err)
    }
})