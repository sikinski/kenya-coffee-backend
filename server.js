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
import contactsRoutes from "./routes/contactsRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import './cron/receiptsUpdater.js'
import './cron/dailyTasksGenerator.js'


import { setupReceiptWS } from "./websockets/receiptWS.js";

dotenv.config();

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 3000

// Настраиваем логгер: только ошибки и важные события, без тел запросов/ответов
const fastify = Fastify({
    logger: {
        level: 'error', // Только ошибки
        serializers: {
            req: (req) => ({
                method: req.method,
                url: req.url,
                // Не логируем body и headers для уменьшения размера логов
            }),
            res: (res) => ({
                statusCode: res.statusCode,
                // Не логируем body ответа
            }),
        }
    }
});

await fastify.register(authPlugin);

// Регаем корсы
// Поддерживаем несколько фронтендов через запятую (например: "http://localhost:3000,http://localhost:3001")
const frontendUrls = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'] // дефолтные значения для разработки

// Логируем настройки CORS при старте (для отладки)
console.log('CORS configuration:');
console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);
console.log('Parsed allowed origins:', frontendUrls);

await fastify.register(cors, {
    origin: (origin, callback) => {
        // Разрешаем запросы без origin (например, Postman, curl)
        if (!origin) {
            return callback(null, true);
        }

        // Проверяем, есть ли origin в списке разрешенных
        if (frontendUrls.includes(origin)) {
            return callback(null, true);
        }

        // Логируем только при блокировке (для отладки)
        console.log('❌ CORS blocked origin:', origin);

        return callback(new Error('Not allowed by CORS'), false);
    },
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
fastify.register(contactsRoutes);
fastify.register(faqRoutes);

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