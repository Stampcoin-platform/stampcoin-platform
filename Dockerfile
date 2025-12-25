# StampCoin Backend Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally first
RUN npm install -g pnpm

# Copy all files first (including patches directory)
COPY . .

# Install dependencies (now patches are available)
RUN pnpm install --frozen-lockfile

# Build frontend and backend
RUN pnpm run build:frontend && pnpm run build

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
