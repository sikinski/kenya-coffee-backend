// Точка входа (инициализация сервера)

import Fastify from "fastify";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

dotenv.config();

const fastify = Fastify({ logger: true });

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

