import prisma from "../config/db.js"; // твой Prisma клиент
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";


export const refresh = async (request, reply) => {
    const { refresh_token } = request.body;

    if (!refresh_token) return reply.status(401).send({ error: "Токен отсутствует" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return reply.status(401).send({ error: "Пользователь не найден" });

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        return { access_token: accessToken, refresh_token: refreshToken }
    } catch (err) {
        return reply.status(401).send({ error: 'Неверный токен' })
    }
}