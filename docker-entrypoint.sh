#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Ждем пока база данных будет готова (просто ждем, т.к. depends_on уже ждет healthcheck)
sleep 3

echo "🔄 Running Prisma schema sync..."
# Используем db push для синхронизации схемы с БД (создаст все таблицы)
# Это работает даже без миграций
npx prisma db push --accept-data-loss --skip-generate

echo "✅ Database schema synced!"
echo "🚀 Starting application..."
# Запускаем приложение
exec npm start

