import prisma from '../../config/db.js';

export const getReceipts = async (request, reply) => {
    const { page, page_size } = request.query

    try {
        // skip - считаем, сколько пропустить
        // Если мы на странице page=3, а размер страницы page_size=10:
        const skip = (Number(page) - 1) * Number(page_size); // сколько пропустить
        const take = Number(page_size); // сколько взять

        const [receipts, total] = await Promise.all([
            prisma.nativeReceipt.findMany({
                skip, // сколько пропустить
                take, // сколько взять
                // orderBy: { processedAt: 'desc' },
            }),
            prisma.receipt.count()
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