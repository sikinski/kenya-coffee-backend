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
