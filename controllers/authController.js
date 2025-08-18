import prisma from "../config/db.js"; // твой Prisma клиент
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";


export const login = async (request, reply) => {
  const { username, password } = request.body;

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) return reply.status(401).send({ error: "Неверный логин или пароль" });

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) return reply.status(401).send({ error: "Неверный логин или пароль" });

  if (user.role !== "admin") {
    return reply.status(403).send({ error: "Нет доступа (только админы)" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { accessToken, refreshToken };
};