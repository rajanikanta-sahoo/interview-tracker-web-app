# ==========================================
# Frontend Dockerfile - Multi-Stage Build
# ==========================================

# ── Stage 1: Build production bundle ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy frontend source files
COPY . .

# Build production distribution
RUN npm run build

# ── Stage 2: Serve via Nginx Alpine ──
FROM nginx:1.27-alpine AS runner

# Remove default Nginx site configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
