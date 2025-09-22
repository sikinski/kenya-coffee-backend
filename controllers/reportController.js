import prisma from "../config/db.js";

export const getReport = async (request, reply) => {
    const { date } = request.query;

    if (!date) {
        return reply.status(400).send('Параметр date обязателен');
    }

    // Создаём диапазон для выбранной даты (начало и конец дня)
    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");

    // Находим первый отчет за эту дату
    const report = await prisma.report.findFirst({
        where: {
            date: {
                gte: start,
                lte: end
            }
        },
        include: {
            user: true
        }
    });

    if (!report) {
        return reply.status(404).send({ message: `Отчет за ${date} не найден` });
    }

    const response = {
        id: report.id,
        date: report.date,
        cash: report.cash,
        non_cash: report.non_cash,
        total: report.total,
        number_purchases: report.number_purchases,
        cash_register: report.cash_register,
        created_at: report.created_at,
        updated_at: report.updated_at,
        username: report.user ? report.user.username : null,
    };

    return reply.send(response);
};
