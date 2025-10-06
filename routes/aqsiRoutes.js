import { getDevices } from "../controllers/aqsi/devicesController.js";
import { getReceipts } from "../controllers/aqsi/receiptsController.js";
import { getNative } from "../controllers/aqsi/nativeReceipts.js";

async function aqsiRoutes(fastify, options) {
    // Devices
    fastify.get('/aqsi/get-devices', getDevices);


    // Orders
    fastify.get('/aqsi/get-receipts', getReceipts)
    fastify.get('/aqsi/native-get', getNative)

}

export default aqsiRoutes;
