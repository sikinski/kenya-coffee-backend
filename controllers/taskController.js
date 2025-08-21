import prisma from "../config/db.js";

export const getTasks = async (request, reply) => {
  const { date } = request.query;

  if (!date) {
    return reply.status(400).send({ error: "Параметр date обязателен" });
  }

  // Преобразуем строку в дату и обнуляем время
  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  // Получаем все задачи на указанную дату
  const tasks = await prisma.dailyTask.findMany({
    where: { date: queryDate }
  });

  return reply.send({ date: queryDate.toISOString(), tasks });
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
      }
    });

    return reply.status(200).send(updatedTask);
  } catch (err) {
    return reply.status(500).send({ error: "Ошибка обновления задачи" });
  }
};
