import prisma from "../config/db.js";

export const getTasks = async (request, reply) => {
    const { date } = request.query;

    if (!date) {
        return reply.status(400).send({ error: "Параметр date обязателен" });
    }

    // Преобразуем строку в дату и обнуляем время
    // начало и конец дня
    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(date + "T23:59:59.999Z");

    console.log(start, end);

    // Получаем все задачи на указанную дату
    const tasks = await prisma.dailyTask.findMany({
        where: {
            date: {
                gte: start,
                lte: end
            }
        },
        orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' }  // добавляем вторичную сортировку
        ],
        include: {
            user: true  // <-- подтягиваем user
        }
    });

    const response = tasks.map(task => ({
        id: task.id,
        text: task.text,
        done: task.done,
        username: task.user ? task.user.username : null, // вместо userId
        date: task.date,
        createdAt: task.createdAt
    }));

    return reply.send({ date: date, tasks: response });
};

// PUT /tasks/25 {done: false}
export const updateTask = async (request, reply) => {
    const { id } = request.params;
    const { done } = request.body;

    if (done === undefined) {
        return reply.status(400).send({ error: "Поле done обязательно" });
    }

    try {
        // Находим задачу
        const task = await prisma.dailyTask.findUnique({ where: { id: Number(id) } });
        if (!task) {
            return reply.status(404).send({ error: "Задача не найдена" });
        }

        // Обновляем done и user_id
        const updatedTask = await prisma.dailyTask.update({
            where: { id: Number(id) },
            data: {
                done,
                userId: request.user.id
            },
        })

        // Получаем username отдельно
        const user = await prisma.user.findUnique({ where: { id: request.user.id } });

        return reply.status(200).send({
            ...updatedTask,
            username: user.username
        });
    } catch (err) {
        return reply.status(500).send({ error: "Ошибка обновления задачи" });
    }
};
