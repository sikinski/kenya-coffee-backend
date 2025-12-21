# Dockerfile
FROM node:20

WORKDIR /backend

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Генерация Prisma Client внутри контейнера
RUN npx prisma generate

# Открываем порт
EXPOSE 3002

# Запускаем приложение
CMD ["npm", "start"]
