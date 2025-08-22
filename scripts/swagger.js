import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import authRoutes from "../routes/authRoutes.js";
import taskRoutes from "../routes/taskRoutes.js";
import authPlugin from "../plugins/auth.js"; // где создаётся authenticate

const fastify = Fastify();

await fastify.register(authPlugin);

// Регистрируем Swagger
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
    uiConfig: { docExpansion: "list" },
    staticCSP: true,
    transformSpecification: (swaggerObject) => swaggerObject,
});

// Регистрируем роуты
fastify.register(authRoutes);
fastify.register(taskRoutes);

await fastify.listen({ port: 4000 }); // временный порт для генерации
console.log("Swagger UI доступен на http://localhost:4000/docs");
