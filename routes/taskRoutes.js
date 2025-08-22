import { getTasks, updateTask } from "../controllers/taskController.js";

export default async function (fastify) {
    // GET /tasks — получить задачи
    fastify.get("/tasks", {
        schema: {
            description: "Получить список задач на заданную дату",
            querystring: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date", description: "Дата задач в формате YYYY-MM-DD" }
                },
                required: ["date"]
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        date: { type: "string", format: "date" },
                        tasks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "number" },
                                    text: { type: "string" },
                                    done: { type: "boolean" },
                                    userId: { type: "number" },
                                    username: { type: "string" },
                                    date: { type: "string", format: "date" },
                                    createdAt: { type: "string", format: "date-time" }
                                }
                            }
                        }
                    }
                }
            }

        },
        handler: getTasks
    });

    // PUT /tasks/:id — обновление конкретной задачи
    fastify.put("/tasks/:id", {
        preHandler: [fastify.authenticate],
        schema: {
            description: "Обновить статус выполнения задачи (done)",
            params: {
                type: "object",
                properties: {
                    id: { type: "number", description: "ID задачи" }
                },
                required: ["id"]
            },
            body: {
                type: "object",
                properties: {
                    done: { type: "boolean", description: "Новый статус задачи" }
                },
                required: ["done"]
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        text: { type: "string" },
                        done: { type: "boolean" },
                        userId: { type: "number" },
                        username: { type: "string" },
                        date: { type: "string", format: "date" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                400: { type: "object", properties: { error: { type: "string" } } },
                404: { type: "object", properties: { error: { type: "string" } } }
            }
        },
        handler: updateTask
    });
}
