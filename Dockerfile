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

# Копируем и делаем исполняемым entrypoint скрипт
COPY docker-entrypoint.sh /backend/docker-entrypoint.sh
RUN chmod +x /backend/docker-entrypoint.sh

# Открываем порт
EXPOSE 3002

# Используем entrypoint скрипт для выполнения миграций перед запуском
ENTRYPOINT ["/backend/docker-entrypoint.sh"]
