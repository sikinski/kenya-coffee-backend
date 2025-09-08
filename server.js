// Точка входа (инициализация сервера)

import Fastify from "fastify";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth.js";
import taskRoutes from "./routes/taskRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

dotenv.config();

const fastify = Fastify({ logger: true });

await fastify.register(authPlugin);

// Регаем корсы
await fastify.register(cors, {
    origin: ["http://localhost:3001"], // твой фронт
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // разрешаем методы
    allowedHeaders: ["Content-Type", "Authorization"], // чтобы токен проходил
    credentials: true
});

// Регистрируем роуты /auth, /refresh
fastify.register(authRoutes);
fastify.register(taskRoutes);
fastify.register(noteRoutes)

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

