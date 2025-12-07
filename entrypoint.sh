#!/bin/sh

# 1. Stop on any error
set -e

# 2. Run Migrations (The Safety Check)
echo "🔍 Checking for pending migrations..."
npx prisma migrate deploy

# 3. Start the Application
echo "🚀 [Launch] Starting the application..."
# We use 'exec' so node becomes PID 1 (handles signals correctly)
exec "$@"