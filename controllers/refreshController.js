import prisma from "../config/db.js";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const refresh = async (request, reply) => {
    const { refresh_token } = request.body;

    if (!refresh_token) {
        return reply.status(401).send({ error: "Токен отсутствует" });
    }

    try {
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET);

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return reply.status(401).send({ error: "Пользователь не найден" });
        }

        const access_token = generateAccessToken(user);
        const refresh_token_new = generateRefreshToken(user);

        return reply.send({
            access_token,
            refresh_token: refresh_token_new
        });
    } catch (err) {
        return reply.status(401).send({ error: "Неверный токен" });
    }
};
