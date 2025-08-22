// middlewares/checkRole.js
export function checkRole(requiredRole) {
    return async function (request, reply) {
        try {
            // Берём юзера из request (его ты сохраняешь при авторизации после проверки токена)
            const user = request.user;

            if (!user) {
                return reply.code(401).send({ error: "Не авторизован" });
            }

            if (user.role !== requiredRole) {
                return reply.code(403).send({ error: "Недостаточно прав" });
            }
        } catch (err) {
            return reply.code(500).send({ error: "Ошибка проверки роли" });
        }
    };
}

// В этой функции в случае успеха мы ничего не возвращаем, в таком случае выполнение кода пройдет дальше (например, мы используем эту функцию в качестве preHandler на админских роутах, и если ошибку она не возвращает, то мы получаем доступ к этим роутам.)