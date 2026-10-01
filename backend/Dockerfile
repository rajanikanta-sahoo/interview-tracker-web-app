# ==========================================
# Backend Dockerfile - Express API Service
# ==========================================
FROM node:20-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY db.js db.json server.js ./
COPY routes/ ./routes/
COPY scraper/ ./scraper/

# Create uploads directory and ensure correct permissions
RUN mkdir -p uploads && chown -R node:node /app

# Run as non-root user for security
USER node

# Expose default API port
EXPOSE 5001

# Environment configurations
ENV PORT=5001 \
    NODE_ENV=production

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Start server
CMD ["node", "server.js"]
