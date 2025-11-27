#!/bin/bash

# Database Initialization Script for Kewen API Platform

set -e

echo "🚀 Initializing Kewen API Platform Database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration before continuing."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database (if seed script exists)
if [ -f "prisma/seed.ts" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo "✅ Database initialization complete!"
echo ""
echo "Next steps:"
echo "1. Review your .env configuration"
echo "2. Start the server with: npm run dev"
echo "3. Access API docs at: http://localhost:3000/api-docs"
