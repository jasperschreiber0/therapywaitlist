#!/bin/bash
# Run after first deploy to set up the database schema and seed data.
# Usage: DATABASE_URL=<your-url> bash migrate.sh

set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "Seeding database with initial clinic data..."
node prisma/seed.js

echo "Done."
