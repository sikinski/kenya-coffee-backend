import cron from 'node-cron'
import prisma from '../config/db.js'
import { ensureTodayReport } from '../functions/ensureTodayReport.js'

// ====== Cron задача ======
// Челябинск = UTC+5
// В cron используется UTC, поэтому для 00:00 по Челябинску нужно запускать в 19:00 UTC
cron.schedule('0 0 * * *', async () => {
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
