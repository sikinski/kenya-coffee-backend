import prisma from "../config/db.js";
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js';

async function main() {
    // await prisma.nativeReceipt.deleteMany();

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

