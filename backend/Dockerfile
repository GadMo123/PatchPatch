FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Copy source files
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared module first
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Build and run backend
WORKDIR /app/backend
RUN npm install
RUN npm run build

# Expose WebSocket port
EXPOSE 5000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENV NODE_ENV=production
ENV MAX_GAMES_PER_SERVER=1000
ENV HEALTH_CHECK_INTERVAL=30000
ENV SERVER_REGION=us-east-1
ENV SERVER_ID=prod-1

CMD ["npm", "run", "serve"]