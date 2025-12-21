#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Ждем пока база данных будет готова (проверяем через psql или просто ждем)
sleep 5

echo "Running Prisma migrations..."
# Выполняем миграции (migrate deploy для продакшена, db push для разработки)
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss || echo "Migration failed, continuing..."

echo "Starting application..."
# Запускаем приложение
exec npm start

