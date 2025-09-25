# Dockerfile
FROM node:20

WORKDIR /backend

COPY package*.json ./
RUN npm install

COPY . .

# Генерация Prisma Client внутри контейнера
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
