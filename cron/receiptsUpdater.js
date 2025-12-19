import cron from 'node-cron'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';
import prisma from '../config/db.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Asia/Yekaterinburg'

// ====== CRON - обновление чеков каждую минуту
cron.schedule('* * * * *', async () => {
    console.log('🔄 Обновляем чеки Aqsi...', new Date().toISOString());

    // Конец завтрашнего дня (чтобы захватить все чеки, включая сегодняшние)
    const currentEndDate = dayjs().tz(TZ).add(2, 'day').endOf('day').toDate();

    let currentBeginDate;

    const last = await prisma.nativeReceipt.findFirst({
        orderBy: { processedAt: 'desc' },
    })

    if (last) {
        // Начинаем с начала дня последнего чека, минус небольшой запас (1 час) для надежности
        const lastDate = dayjs(last.processedAt).tz(TZ);
        currentBeginDate = lastDate.startOf('day').subtract(1, 'hour').toDate();
    } else {
        // Если нет чеков, загружаем за последние 2 месяца
        const twoMonthsAgo = dayjs().tz(TZ).subtract(2, 'month');
        currentBeginDate = twoMonthsAgo.startOf('day').toDate();
    }

    try {
        await loadReceiptsForPeriod(currentBeginDate, currentEndDate)
    } catch (err) {
        console.error('❌ Ошибка при обновлении чеков:', err)
    }
}, {
    timezone: TZ
})