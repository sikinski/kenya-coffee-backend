import qs from 'qs'
import prisma from '../../config/db.js'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import 'dayjs/locale/ru.js'
import productTypes from '../../helpers/product-types.js'

dayjs.locale('ru')
dayjs.extend(minMax);
dayjs.extend(isBetween);

import { parseCommaList } from '../../utils/parseCommaList.js'
import { getDateRange } from '../../utils/getDateRange.js'

async function getFilteredReceipts(request, dates) {
    // --- Разбор query-параметров ---
    const queryString = request.raw.url.split('?')[1] || ''
    const query = qs.parse(queryString, { allowDots: true })

    const devicesParam = (parseCommaList(query.devices) || [])
        .map(sn => sn.toString().trim())
        .filter(Boolean)

    const productsParam = (parseCommaList(query.products) || [])
        .map(product => product.toString().trim())
        .filter(Boolean)

    // --- Получаем диапазон дат ---
    const range = getDateRange(dates)
    if (!range) {
        throw new Error('Не указан диапазон дат')
    }

    const from = range.processedAt.gte
    const to = range.processedAt.lte

    // --- Берём все чеки за период ---
    const where = { processedAt: { gte: from, lte: to } }

    if (devicesParam.length > 0) {
        where.OR = devicesParam.map(sn => ({
            raw: { path: ['deviceSN'], equals: sn }
        }))
    }

    const receipts = await prisma.nativeReceipt.findMany({
        where,
        select: { processedAt: true, raw: true }
    })

    return { receipts, from, to }
}

export const getSalesGraph = async (request, reply) => {
    try {
        const queryString = request.raw.url.split('?')[1] || ''
        const query = qs.parse(queryString, { allowDots: true })
        const dates = query.dates || {}
        const { receipts, from, to } = await getFilteredReceipts(request, dates)

        // --- Группировка для графика ---
        const points = buildGraphPoints(receipts, from, to, 7)

        const periodLabel = dates.custom || (dates.from && dates.to ? `${dates.from} - ${dates.to}` : 'custom')

        return reply.status(200).send({
            period: periodLabel,
            data: points
        })

    } catch (err) {
        console.error(err)
        return reply.status(500).send('Не удалось получить график продаж')
    }
}

export const getProductsGraph = async (request, reply) => {
    try {
        const productTypeObj = productTypes.find(obj => obj.type === request.query.product_type)
        if (!productTypeObj) {
            return reply.status(400).send({ error: 'Неверный тип продукта' })
        }

        const products = productTypeObj.items

        // === получить чеки по датам ===
        const queryString = request.raw.url.split('?')[1] || ''
        const query = qs.parse(queryString, { allowDots: true })
        const dates = query.dates || {}
        const { receipts, from, to } = await getFilteredReceipts(request, dates)

        // === ===
        const productsParam = (parseCommaList(products.join(',')) || [])
            .map(product => product.toString().trim().toLowerCase()) // приводим к нижнему регистру сразу
            .filter(Boolean)


        let filteredReceipts = receipts

        // Если указаны продукты, фильтруем чеки
        if (productsParam.length > 0) {
            filteredReceipts = receipts.filter(receipt => {
                const positions = receipt.raw?.content?.positions || []

                // Проверяем, есть ли хотя бы один продукт из productsParam в тексте позиций
                return positions.some(position => {
                    const positionText = position.text?.toLowerCase() || ''
                    return productsParam.some(product =>
                        positionText.includes(product)
                    )
                })
            })
        }

        // --- Считаем статистику по продуктам ---
        const productStats = {}

        filteredReceipts.forEach(receipt => {
            const positions = receipt.raw?.content?.positions || []

            positions.forEach(position => {
                const positionText = position.text?.toLowerCase() || ''

                // Находим все продукты, которые встречаются в этом тексте
                productsParam.forEach(product => {
                    if (positionText.includes(product)) {
                        if (!productStats[product]) {
                            productStats[product] = 0
                        }
                        productStats[product]++
                    }
                })
            })
        })

        // Преобразуем в нужный формат (возвращаем оригинальные названия продуктов)
        const result = Object.entries(productStats).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1), // восстанавливаем регистр для красоты
            count
        }))

        return reply.status(200).send(result)

    } catch (err) {
        console.error(err)
        return reply.status(500).send('Не удалось получить график покупок')
    }
}

// ============ HELPERS ============ 
function buildGraphPoints(receipts, from, to, dotsCount = 7) {
    const totalDays = dayjs(to).diff(dayjs(from), 'day') + 1
    const step = Math.max(1, Math.ceil(totalDays / dotsCount))
    const points = []

    for (let i = 0; i < totalDays; i += step) {
        const start = dayjs(from).add(i, 'day').startOf('day')
        const end = dayjs.min(start.add(step - 1, 'day').endOf('day'), dayjs(to))

        const value = receipts
            .filter(r => dayjs(r.processedAt).isBetween(start, end, null, '[]'))
            .reduce((sum, r) => {
                const amount = Number(r.raw?.amount) || 0;
                const type = r.raw?.content?.type;

                // AQSI считает только чеки типа 1 (продажи) и вычитает чеки типа 2 (возвраты)
                // Остальные типы или если тип не указан (undefined/null) - не учитываем
                if (type === 1) {
                    return sum + amount;
                } else if (type === 2) {
                    return sum - amount; // Возвраты вычитаем
                }
                return sum;
            }, 0)

        // Подпись: если шаг один день, выводим день недели, иначе дату диапазона
        const text = step === 1
            ? start.format('dd') // Пн, Вт, …
            : totalDays > 60
                ? start.format('MMM') // Янв, Фев …
                : `${start.format('DD.MM')} - ${end.format('DD.MM')}`


        points.push({ text, value: Math.round(value) })
    }

    return points
}

function getUniqueProducts(receipts) {
    const products = receipts.map(receiptObj => [...receiptObj.raw.content.positions])
        .flat(1); // или .flat()

    let textProducts = products.map(product => product.text);
    let uniqueProducts = new Set(textProducts);

    return Array.from(uniqueProducts)
}