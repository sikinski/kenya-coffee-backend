import prisma from '../../config/db.js';
import { parseCommaList } from '../../utils/parseCommaList.js';

export const getReceipts = async (request, reply) => {
    const { page, page_size, devices } = request.query

    const devicesParams = (parseCommaList(devices) || [])
        .map(sn => sn.toString().trim())
        .filter(Boolean);


    // Нужно учитывать фильтр devicesParams. Если массив не пустой, то нужно фильтровать. В массиве передаются номера - сериийные номера, она находятся в receipt в поле: .raw.deviceSN
    try {
        // skip - считаем, сколько пропустить
        // Если мы на странице page=3, а размер страницы page_size=10:
        const skip = (Number(page) - 1) * Number(page_size); // сколько пропустить
        const take = Number(page_size); // сколько взять

        // Базовое условие поиска
        let where = {}

        // Если devicesParams есть и не пустой, фильтруем по deviceSN
        if (devicesParams.length > 0) {
            where = {
                OR: devicesParams.map(sn => ({
                    raw: {
                        path: ['deviceSN'],
                        equals: sn
                    }
                }))
            };
        }
        console.log('devicesParams:', devicesParams)
        console.log('where:', JSON.stringify(where, null, 2))

        const [receipts, total] = await Promise.all([

            prisma.nativeReceipt.findMany({
                where,
                skip, // сколько пропустить
                take, // сколько взять
                orderBy: { processedAt: 'desc' },
            }),
            prisma.nativeReceipt.count({ where }) // ✅ Возвращает общее количество (total) с учётом фильтра.
        ]);


        return reply.status(200).send({
            receipts: receipts || [],
            pagination: {
                page: Number(page),
                page_size: Number(page_size),
                total: total
            }

        })
    } catch (err) {
        console.error(err)
        return reply.status(500).send('Не удалось получить чеки')
    }
}