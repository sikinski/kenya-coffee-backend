import { getReport } from '../controllers/reportController.js'

export default async function (fastify) {

    fastify.get("/report", { preHandler: [fastify.authenticate], handler: getReport })
}