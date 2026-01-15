# Multi-stage build for backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/tsconfig*.json ./backend/
COPY backend/src ./backend/src

WORKDIR /app/backend

# Install dependencies
RUN npm ci

# Build TypeScript
RUN npm run build

# Production stage for backend
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy built backend from builder
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run node
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/esm/src/server.js"]

EXPOSE 3001
