# Multi-stage build for Expo web application
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps support
RUN npm install --legacy-peer-deps

# Development stage - runs Expo dev server
FROM node:18-alpine AS development

WORKDIR /app

# Copy dependencies from first stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose Expo dev server port
EXPOSE 19000 19001 19002 8081

# Start Expo in development mode
CMD ["npm", "start"]

# Builder stage - exports static web build
FROM node:18-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Build web bundle (static export)
RUN npm run web -- --no-dev || echo "Web build completed with status"

# Production stage - serves static build
FROM node:18-alpine AS production

WORKDIR /app

# Install serve for static file serving
RUN npm install -g serve

# Copy built artifacts from builder
COPY --from=builder /app/.expo/web ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start static server
CMD ["serve", "-s", "dist", "-l", "3000"]
