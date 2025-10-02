import { getDevices } from "../controllers/aqsi/devicesController.js";
import { getReceipts } from "../controllers/aqsi/receiptsController.js";

async function aqsiRoutes(fastify, options) {
    // Devices
    fastify.get('/aqsi/get-devices', getDevices);


    // Orders
    fastify.get('/aqsi/get-receipts', getReceipts)
}

export default aqsiRoutes;
