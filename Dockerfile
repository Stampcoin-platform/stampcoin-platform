# StampCoin Backend Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.4.1

# Copy package files and patches first
COPY package.json pnpm-lock.yaml* ./
COPY patches ./patches

# Copy all project files (needed for patches to work correctly)
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build frontend and backend
RUN pnpm build:frontend && pnpm build

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]

