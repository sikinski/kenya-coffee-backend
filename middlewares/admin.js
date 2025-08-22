export const isAdmin = (request, reply, done) => {
    if (request.user.role !== "admin") {
        return reply.status(403).send({ error: "Доступ запрещён" });
    }
    done();
};

