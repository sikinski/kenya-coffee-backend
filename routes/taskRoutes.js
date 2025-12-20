import {
    getTasks,
    createTask,
    updateTask,
    updateTasksOrder,
    deleteTask,
    getDailyTasks,
    updateDailyTask,
    deleteDailyTask,
    syncTodayChecklist
} from "../controllers/taskController.js";

export default async function (fastify) {
    // ======== TASKS (базовый список задач) ========
    // GET /tasks — получить все задачи
    fastify.get("/tasks", { preHandler: [fastify.authenticate] }, getTasks);

    // POST /tasks — создать задачу
    fastify.post("/tasks", { preHandler: [fastify.authenticate] }, createTask);

    // PUT /tasks/:id — обновить задачу
    fastify.put("/tasks/:id", { preHandler: [fastify.authenticate] }, updateTask);

    // PUT /tasks/order — обновить порядок задач (массовое обновление)
    fastify.put("/tasks/order", { preHandler: [fastify.authenticate] }, updateTasksOrder);

    // DELETE /tasks/:id — удалить задачу
    fastify.delete("/tasks/:id", { preHandler: [fastify.authenticate] }, deleteTask);

    // ======== DAILY TASKS (ежедневные задачи) ========
    // GET /daily-tasks?date=YYYY-MM-DD — получить задачи на день (если date не указан, берется сегодня)
    fastify.get("/daily-tasks", { preHandler: [fastify.authenticate] }, getDailyTasks);

    // PUT /daily-tasks/:id — обновить ежедневную задачу (например, отметить done)
    fastify.put("/daily-tasks/:id", { preHandler: [fastify.authenticate] }, updateDailyTask);

    // DELETE /daily-tasks/:id — удалить ежедневную задачу
    fastify.delete("/daily-tasks/:id", { preHandler: [fastify.authenticate] }, deleteDailyTask);

    // POST /daily-tasks/sync — синхронизировать сегодняшний чеклист с шаблоном задач
    fastify.post("/daily-tasks/sync", { preHandler: [fastify.authenticate] }, syncTodayChecklist);
}
