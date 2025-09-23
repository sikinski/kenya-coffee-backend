import prisma from "../config/db.js";

export const getUsers = async (request, reply) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true,
                // password не включаем
            }
        })

        if (!users || users.length === 0) {
            return reply.status(404).send('Пользователи не найдены.')
        }

        return reply.status(200).send(users)
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error)
        return reply.status(500).send({ error: 'Ошибка сервера' })
    }
}