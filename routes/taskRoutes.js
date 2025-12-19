import { getTasks } from "../controllers/taskController.js";

export default async function (fastify) {
    // GET /tasks — получить задачи
    fastify.get("/tasks", { handler: getTasks });

    // // PUT /tasks/:id — обновление конкретной задачи
    // fastify.put("/tasks/:id", { preHandler: [fastify.authenticate], handler: updateTask });

    // fastify.post('/tasks', { preHandler: [fastify.authenticate], handler: createTask })


}
