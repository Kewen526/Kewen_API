# Multi-stage build for optimized image size

# Stage 1: Build
FROM node:18-slim AS builder

WORKDIR /app

# Install build dependencies (Debian has better binary support)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production --legacy-peer-deps && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# Create necessary directories
RUN mkdir -p logs uploads

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3020

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3020/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
