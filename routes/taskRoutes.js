import { getTasks } from "../controllers/taskController.js";

export default async function (fastify) {
  fastify.get("/tasks", getTasks);
}
