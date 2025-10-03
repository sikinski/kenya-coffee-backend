// Точка входа (инициализация сервера)

import Fastify from "fastify";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth.js";
import taskRoutes from "./routes/taskRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import aqsiRoutes from "./routes/aqsiRoutes.js";
import { seedAllReceipts } from './controllers/aqsi/initPayments.js';
import { uploadReceipts } from "./controllers/aqsi/uploadReceipts.js";


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

// Регистрируем роуты /auth, /refresh
fastify.register(authRoutes);
fastify.register(taskRoutes);
fastify.register(noteRoutes)
fastify.register(reportRoutes)
fastify.register(userRoutes)
fastify.register(aqsiRoutes)

seedAllReceipts() // Наполняет базу чеками за последние 3 мес., если база чеков пуста
// uploadReceipts() // Делает запрос каждые 30 сек. в aqsi, чтоб получать свежие чеки 

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`Сервер запущен на http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

