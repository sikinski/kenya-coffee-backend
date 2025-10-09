import { getDevices, getShopByID } from "../controllers/aqsi/devicesController.js";
import { getReceipts } from "../controllers/aqsi/receiptsController.js";

async function aqsiRoutes(fastify, options) {
    // Devices
    fastify.get('/aqsi/get-devices', getDevices);
    fastify.get('/aqsi/shops/:id', getShopByID);

    // Orders
    fastify.get('/aqsi/get-receipts', getReceipts)

}

export default aqsiRoutes;
