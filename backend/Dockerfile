# NexusStream Backend - Multi-stage Dockerfile
# SPEC REFERENCE: Optional - "Dockerfile/docker-compose setup for local running"

# =============================================================================
# Stage 1: Build Stage
# =============================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies (for native modules if any)
RUN apk add --no-cache python3 make g++

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Prune devDependencies after build
RUN npm prune --production

# =============================================================================
# Stage 2: Production Stage
# =============================================================================
FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create data directory for file persistence
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
