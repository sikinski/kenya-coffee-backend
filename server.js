// Точка входа (инициализация сервера)

import Fastify from "fastify";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const fastify = Fastify({ logger: true });

// Регистрируем маршрут /auth
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

