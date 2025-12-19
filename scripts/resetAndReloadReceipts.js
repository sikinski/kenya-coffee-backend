import prisma from '../config/db.js'
import { loadReceiptsForPeriod } from '../functions/loadReceiptsForPeriod.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Asia/Yekaterinburg'

async function resetAndReload() {
    try {
        console.log('🗑️  Очищаем базу данных...')

        // Очищаем кэш статистики
        const deletedCache = await prisma.statsCache.deleteMany()
        console.log(`✅ Удалено записей из кэша: ${deletedCache.count}`)

        // Очищаем все чеки
        const deletedReceipts = await prisma.nativeReceipt.deleteMany()
        console.log(`✅ Удалено чеков: ${deletedReceipts.count}`)

        console.log('\n📥 Начинаем загрузку чеков из AQSI за ВСЕ время...')

        // Конец завтрашнего дня, чтобы захватить все чеки
        let currentEndDate = dayjs().tz(TZ).add(2, 'day').endOf('day').toDate()

        // Начинаем с 1 месяца назад и будем идти в прошлое по 1 месяцу
        // (AQSI не принимает запросы за слишком большие периоды)
        let currentBeginDate = dayjs().tz(TZ).subtract(1, 'month').startOf('day').toDate()

        console.log(`📅 Начинаем загрузку с периода: ${dayjs(currentBeginDate).format('DD.MM.YYYY')} - ${dayjs(currentEndDate).format('DD.MM.YYYY')}`)

        // Загружаем чеки порциями по 1 месяцу
        // ВАЖНО: AQSI API предоставляет данные только за последние 6 месяцев
        let totalLoaded = 0
        const maxMonths = 6 // Ограничение API AQSI
        let monthsLoaded = 0

        while (monthsLoaded < maxMonths) {
            try {
                const hasData = await loadReceiptsForPeriod(currentBeginDate, currentEndDate)

                if (hasData) {
                    totalLoaded++
                    monthsLoaded++
                    console.log(`📦 Загружена порция ${totalLoaded} (${dayjs(currentBeginDate).format('DD.MM.YYYY')} - ${dayjs(currentEndDate).format('DD.MM.YYYY')})`)
                } else {
                    console.log(`ℹ️  Нет данных за период ${dayjs(currentBeginDate).format('DD.MM.YYYY')} - ${dayjs(currentEndDate).format('DD.MM.YYYY')}`)
                }

                // Переходим к следующему периоду (на 1 месяц назад)
                currentEndDate = currentBeginDate
                currentBeginDate = dayjs(currentEndDate).tz(TZ).subtract(1, 'month').startOf('day').toDate()

            } catch (err) {
                // Если получили ошибку 400 о лимите 6 месяцев, останавливаемся
                if (err.response?.status === 400 && err.response?.data?.errors?.some(e => e.includes('6 месяцев'))) {
                    console.log('ℹ️  Достигнут лимит API AQSI (6 месяцев). За более ранние данные обращайтесь в личный кабинет ОФД.')
                    break
                }
                // Для других ошибок продолжаем
                console.error(`⚠️  Ошибка при загрузке периода: ${err.message}`)
                currentEndDate = currentBeginDate
                currentBeginDate = dayjs(currentEndDate).tz(TZ).subtract(1, 'month').startOf('day').toDate()
            }
        }

        if (monthsLoaded >= maxMonths) {
            console.log('ℹ️  Загружены данные за максимально доступный период (6 месяцев через API AQSI)')
        }

        // Подсчитываем итоговое количество
        const finalCount = await prisma.nativeReceipt.count()
        console.log(`\n✅ Готово! Всего загружено чеков: ${finalCount}`)

    } catch (err) {
        console.error('❌ Ошибка при сбросе и загрузке:', err)
        throw err
    } finally {
        await prisma.$disconnect()
    }
}

resetAndReload()

