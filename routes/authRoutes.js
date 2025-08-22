import { login } from "../controllers/authController.js";
import { refresh } from "../controllers/refreshController.js";

export default async function authRoutes(fastify) {
    // fastify.post("/auth", login)
    fastify.post("/auth", {
        schema: {
            body: {
                type: "object",
                required: ["username", "password"], // обязательные поля
                properties: {
                    username: { type: "string", description: "Логин пользователя" },
                    password: { type: "string", description: "Пароль пользователя" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        access_token: { type: "string", description: "JWT токен для доступа" },
                        refresh_token: { type: "string", description: "JWT токен для обновления" }
                    }
                },
                401: { type: "object", properties: { error: { type: "string" } } },
                403: { type: "object", properties: { error: { type: "string" } } }
            }
        },
        handler: login
    });

    // fastify.post("/refresh", refresh)
    fastify.post("/refresh", {
        schema: {
            body: {
                type: "object",
                required: ["refresh_token"],
                properties: {
                    refresh_token: { type: "string", description: "Refresh токен пользователя" }
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        access_token: { type: "string" },
                        refresh_token: { type: "string" }
                    }
                },
                401: { type: "object", properties: { error: { type: "string" } } }
            }
        },
        handler: refresh
    });
}
