// Точка входа (инициализация сервера)

import Fastify from "fastify";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import jwt from "jsonwebtoken";

dotenv.config();

const fastify = Fastify({ logger: true });

// Регаем сваггер
await fastify.register(swagger, {
    swagger: {
        info: {
            title: "Coffee New Day API",
            description: "API для кофейни New Day",
            version: "1.0.0",
        },
    },
});

await fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list" }, // none or full
    staticCSP: true,
    transformSpecification: (swaggerObject, request, reply) => {
        return swaggerObject;
    },
});

// Регаем корсы
await fastify.register(cors, {
    origin: ["http://localhost:3001"], // Разрешаем фронту
    credentials: true // если нужны cookie/авторизация
});

// Декоратор, будем использовать его как preHandler
fastify.decorate("authenticate", async function (request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return reply.code(400).send({ error: "Токен не предоставлен" });
        }

        const token = authHeader.split(" ")[1]; // Bearer <token>
        const payload = jwt.verify(token, process.env.ACCESS_SECRET);

        request.user = payload; // кладём данные в request.user. Это поле мы создаем сами
    } catch (err) {
        reply.code(401).send({ error: "Не авторизован или токен просрочен" });
    }
});


// Регистрируем роуты /auth, /refresh
fastify.register(authRoutes);

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
        console.log("Сервер запущен на http://localhost:3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

