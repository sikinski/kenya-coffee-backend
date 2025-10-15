import { getDevices, getShopByID } from "../controllers/aqsi/devicesController.js";
import { getReceipts } from "../controllers/aqsi/receiptsController.js";
import { getStats } from "../controllers/aqsi/getStats.js";

async function aqsiRoutes(fastify, options) {
    // Devices
    fastify.get('/aqsi/get-devices', { preHandler: [fastify.authenticate] }, getDevices);
    fastify.get('/aqsi/shops/:id', { preHandler: [fastify.authenticate] }, getShopByID);

    // Orders
    fastify.get('/aqsi/get-receipts', { preHandler: [fastify.authenticate] }, getReceipts)

    fastify.get('/aqsi/get-stats', { preHandler: [fastify.authenticate] }, getStats)

}

export default aqsiRoutes;
