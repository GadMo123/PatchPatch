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

EXPOSE 5000

CMD ["npm", "run", "serve"]