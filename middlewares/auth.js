import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authenticate = (request, reply, done) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: "Токен отсутствует" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    request.user = decoded; // добавляем user к request
    done();
  } catch (err) {
    return reply.status(401).send({ error: "Неверный токен" });
  }
};
