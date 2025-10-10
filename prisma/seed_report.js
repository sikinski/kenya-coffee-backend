import prisma from '../config/db.js'

async function main() {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0) // обнуляем время

    const existing = await prisma.report.findFirst({
        where: { date: today }
    })

    if (!existing) {
        await prisma.report.create({
            data: {
                date: today,
                cash: null,
                non_cash: null,
                total: null,
                number_purchases: null,
                cash_register: null
            }
        })
        console.log("✅ Создан пустой отчёт на сегодня.")
    } else {
        console.log("ℹ️ Отчёт на сегодня уже существует, пропускаем.")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
