import cron from 'node-cron'
import prisma from '../config/db.js'

// ====== Функция, которая раньше была в seed_report.js ======
async function ensureTodayReport() {
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

// ====== Cron задача ======
// Челябинск = UTC+5
// В cron используется UTC, поэтому для 00:00 по Челябинску нужно запускать в 19:00 UTC
cron.schedule('54 16 * * *', async () => {
  console.log('🕛 Запускаем создание отчёта за сегодня (00:00 Челябинск)')
  try {
    await ensureTodayReport()
  } catch (err) {
    console.error('❌ Ошибка при создании отчёта:', err)
  } finally {
    await prisma.$disconnect()
  }
}, {
  timezone: "Asia/Yekaterinburg" // <-- Челябинск/Екатеринбург (UTC+5)
})
