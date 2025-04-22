#!/bin/sh

# Script to initialize database and start server
# Uses sh instead of bash for Alpine compatibility

set -e

echo "Starting Ship Simulator server initialization..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z -v -w30 db 5432; do
  echo "Waiting for PostgreSQL at db:5432..."
  sleep 2
done
echo "Database is up and ready!"

# Initialize Prisma
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "No migrations found. Creating initial migration..."
  npx prisma migrate dev --name initial --create-only
fi
npx prisma migrate deploy

# Create initial admin user if needed
echo "Setting up initial admin user..."
node scripts/create-admin.js

# Start the server
echo "Starting server..."
exec "$@"
