// Декоратор, будем использовать его как preHandler
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";

export default fp(async function (fastify, opts) {
    fastify.decorate("authenticate", async function (request, reply) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                return reply.code(401).send({ error: "Токен не предоставлен" });
            }

            const token = authHeader.split(" ")[1]; // Bearer <token>
            const payload = jwt.verify(token, process.env.ACCESS_SECRET);

            request.user = payload; // добавляем user в запрос
        } catch (err) {
            return reply.code(401).send({ error: "Не авторизован или токен просрочен" });
        }
    });
});
