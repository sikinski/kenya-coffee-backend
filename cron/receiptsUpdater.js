import cron from 'node-cron'
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';
import prisma from '../config/db.js'

console.log('🔄 Обновляем чеки Aqsi...', new Date().toISOString());

// ====== DATE
let currentEndDate = new Date();
currentEndDate.setDate(currentEndDate.getDate() + 2); // сегодня + 2 дня
currentEndDate.setHours(23, 59, 59, 999);

let currentBeginDate: Date;

// Берём последнюю запись
const last = await prisma.nativeReceipt.findFirst({
    orderBy: { processedAt: 'desc' },
})

if (last) {
    const lastDate = new Date(last.processedAt);

    // Обнуляем часы, минуты и секунды **локально**
    lastDate.setHours(0, 0, 0, 0);

    // Для страховки оставляем минус 5 часов, если действительно нужно
    // Но лучше проверять, что твоя дата в базе уже хранится без TZ
    currentBeginDate = new Date(lastDate.getTime() - 5 * 60 * 60 * 1000);
} else {
    // Если чеков нет, берём последние 2 месяца
    const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;
    currentBeginDate = new Date(currentEndDate.getTime() - twoMonthsMs);
}

// Загружаем чеки за период
loadReceiptsForPeriod(currentBeginDate, currentEndDate)

// ====== CRON
cron.schedule('* * * * *', async () => {
    console.log('🔄 Обновляем чеки Aqsi...', new Date().toISOString());

    let currentEndDate = new Date();
    currentEndDate.setDate(currentEndDate.getDate() + 2);
    currentEndDate.setHours(23, 59, 59, 999);

    let currentBeginDate: Date;

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
        loadReceiptsForPeriod(currentBeginDate, currentEndDate)
    } catch (err) {
        console.error('❌ Ошибка при обновлении чеков:', err)
    }
})


// import cron from 'node-cron'
// import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';
// import prisma from '../config/db.js'

// console.log('🔄 Обновляем чеки Aqsi...', new Date().toISOString());

// // ====== DATE
// let currentEndDate = new Date();
// let currentBeginDate;

// currentEndDate.setDate(currentEndDate.getDate() + 2); // сегодня + 2 дня
// currentEndDate.setHours(23, 59, 59, 999);
// // ======

// const last = await prisma.nativeReceipt.findFirst({
//     orderBy: { processedAt: 'desc' },
// })
// if (last) {
//     const lastDate = new Date(last.processedAt);

//     // Берём день последнего чека, обнуляем время
//     lastDate.setUTCHours(0, 0, 0, 0);

//     // Минус 5 часов для страховки
//     currentBeginDate = new Date(lastDate.getTime() - 5 * 60 * 60 * 1000);
// } else {
//     // Если чеков нет, берём последние 2 месяца
//     const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;
//     currentBeginDate = new Date(currentEndDate.getTime() - twoMonthsMs);
// }
// loadReceiptsForPeriod(currentBeginDate, currentEndDate)

// cron.schedule('* * * * *', async () => {
//     console.log('🔄 Обновляем чеки Aqsi...', new Date().toISOString());

//     // ====== DATE
//     let currentEndDate = new Date();
//     let currentBeginDate;

//     currentEndDate.setDate(currentEndDate.getDate() + 2); // сегодня + 2 дня
//     currentEndDate.setHours(23, 59, 59, 999);
//     // ======

//     const last = await prisma.nativeReceipt.findFirst({
//         orderBy: { processedAt: 'desc' },
//     })
//     if (last) {
//         const lastDate = new Date(last.processedAt);

//         // Берём день последнего чека, обнуляем время
//         lastDate.setUTCHours(0, 0, 0, 0);

//         // Минус 5 часов для страховки
//         currentBeginDate = new Date(lastDate.getTime() - 5 * 60 * 60 * 1000);
//     } else {
//         // Если чеков нет, берём последние 2 месяца
//         const twoMonthsMs = 2 * 30 * 24 * 60 * 60 * 1000;
//         currentBeginDate = new Date(currentEndDate.getTime() - twoMonthsMs);
//     }

//     try {
//         loadReceiptsForPeriod(currentBeginDate, currentEndDate)
//     } catch (err) {
//         console.error('❌ Ошибка при обновлении чеков:', err)
//     }
// })

