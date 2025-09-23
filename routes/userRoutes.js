import { getUsers } from "../controllers/userController.js"

export default async function (fastify) {
    fastify.get('/users', { preHandler: [fastify.authenticate], handler: getUsers })
}