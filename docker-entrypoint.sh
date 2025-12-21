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

echo "🌱 Running database seeds..."
# Выполняем сиды (если они еще не выполнены)
echo "  → Seeding users..."
npm run seed:users || echo "  ⚠️  Users seed skipped or failed"

echo "  → Seeding contacts..."
node prisma/seed_contacts.js || echo "  ⚠️  Contacts seed skipped or failed"

echo "  → Seeding receipts (this may take a while)..."
npm run seed:receipts || echo "  ⚠️  Receipts seed skipped or failed"

echo "✅ Seeds completed!"
echo "🚀 Starting application..."
# Запускаем приложение
exec npm start

