import { getDevices } from "../controllers/aqsi/devicesController.js";

async function aqsiRoutes(fastify, options) {
    fastify.get("/aqsi/get-devices", getDevices);
}

export default aqsiRoutes;
