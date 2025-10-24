import { getDevices, getShopByID } from "../controllers/aqsi/devicesController.js";
import { getReceipts } from "../controllers/aqsi/receiptsController.js";
import { getStats, resetStats } from "../controllers/aqsi/getStats.js";
import { getSalesGraph, getProductsGraph } from "../controllers/aqsi/getGraphs.js";

async function aqsiRoutes(fastify, options) {
    // Devices
    fastify.get('/aqsi/get-devices', { preHandler: [fastify.authenticate] }, getDevices);
    fastify.get('/aqsi/shops/:id', { preHandler: [fastify.authenticate] }, getShopByID);

    // Orders
    fastify.get('/aqsi/get-receipts', { preHandler: [fastify.authenticate] }, getReceipts)

    fastify.get('/aqsi/get-stats', { preHandler: [fastify.authenticate] }, getStats)
    fastify.post('/aqsi/reset-stats', { preHandler: [fastify.authenticate] }, resetStats)

    fastify.get('/aqsi/sales-graph', { preHandler: [fastify.authenticate] }, getSalesGraph)
    fastify.get('/aqsi/products-graph', { preHandler: [fastify.authenticate] }, getProductsGraph)

}

export default aqsiRoutes;
