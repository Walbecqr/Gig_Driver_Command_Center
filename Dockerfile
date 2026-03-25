# Multi-stage build for Expo / React Native web application
# Base image is node:24-alpine (matches the locally pulled image)

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

# --legacy-peer-deps handles the mixed react-navigation / expo-router peer chain
RUN npm install --legacy-peer-deps

# ── Stage 2: development server ───────────────────────────────────────────────
FROM node:24-alpine AS development

WORKDIR /app

# Re-use installed modules from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source (docker-compose volume-mounts override this at runtime for HMR)
COPY . .

# Metro bundler (8081), Expo web (19006), legacy Expo ports
EXPOSE 8081 19000 19001 19002 19006

# Non-interactive Expo web server.
# --web          → starts the Webpack/Metro web server (browser-accessible)
# --host lan     → binds to 0.0.0.0 so the host machine can reach it
# EXPO_NO_REDIRECT_PAGE skips the "open in browser" redirect page
ENV EXPO_NO_REDIRECT_PAGE=1
CMD ["npx", "expo", "start", "--web", "--host", "lan"]

# ── Stage 3: static web builder ───────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Export a static web bundle to /app/dist
RUN npx expo export --platform web --output-dir dist

# ── Stage 4: production static server ─────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
