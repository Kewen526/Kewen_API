#!/bin/bash

# Complete Setup Script for Kewen API Platform

set -e

echo "🎉 Welcome to Kewen API Platform Setup"
echo "========================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p logs uploads

# Setup environment
echo ""
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment configuration..."
    cp .env.example .env
    echo "✅ .env file created. Please configure it before starting the server."
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with database credentials"
echo "2. Run 'npm run db:migrate' to initialize the database"
echo "3. Start the server with 'npm run dev'"
echo ""
echo "For Docker deployment:"
echo "  docker-compose up -d"
echo ""
echo "Documentation: http://localhost:3000/api-docs"
echo ""
echo "Happy coding! 🚀"
