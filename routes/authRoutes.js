import { login } from "../controllers/authController.js";
import { refresh } from "../controllers/refreshController.js";

export default async function authRoutes(fastify) {
    fastify.post("/auth", { handler: login });
    fastify.post("/refresh", { handler: refresh });
}
