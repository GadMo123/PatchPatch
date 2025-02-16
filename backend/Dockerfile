FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Copy source files
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared module
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm install
RUN npm run build

# Expose WebSocket port
EXPOSE 5000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Environment variables will be provided at runtime
ENV NODE_ENV=production

CMD ["npm", "run", "serve"]