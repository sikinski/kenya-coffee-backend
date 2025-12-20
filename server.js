// Точка входа (инициализация сервера)

import Fastify from "fastify";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import authPlugin from "./plugins/auth.js";
import taskRoutes from "./routes/taskRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import aqsiRoutes from "./routes/aqsiRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import './cron/receiptsUpdater.js'
import './cron/dailyTasksGenerator.js'


import { setupReceiptWS } from "./websockets/receiptWS.js";

dotenv.config();

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 3000

const fastify = Fastify({ logger: true });

await fastify.register(authPlugin);

// Регаем корсы
await fastify.register(cors, {
    origin: process.env.FRONTEND_URL, // твой фронт
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // разрешаем методы
    allowedHeaders: ["Content-Type", "Authorization"], // чтобы токен проходил
    credentials: true
});

// Регистрируем multipart для загрузки файлов
await fastify.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB максимум
    }
});

// Статическая раздача файлов из uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
await fastify.register(staticFiles, {
    root: join(__dirname, 'uploads'),
    prefix: '/uploads/'
});

// Регистрируем роуты
fastify.register(authRoutes);
fastify.register(taskRoutes);
fastify.register(noteRoutes);
fastify.register(userRoutes);
fastify.register(aqsiRoutes);
fastify.register(menuRoutes);


const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });

        // Передаем внутренний Node-сервер в WS
        setupReceiptWS(fastify.server);

        console.log(`Сервер запущен на http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};


await start();