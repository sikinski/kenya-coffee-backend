import { getTasks } from "../controllers/taskController.js";
import { updateTask } from "../controllers/taskController.js";

export default async function (fastify) {
  fastify.get("/tasks", getTasks);

  // PUT /tasks/:id — обновление конкретной задачи
  fastify.put("/tasks/:id", { preHandler: [fastify.authenticate] }, updateTask);
}
