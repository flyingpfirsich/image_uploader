# Stage 1: Build the frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl

# Copy package files and install production dependencies only
COPY backend/package*.json ./
RUN npm install --production

# Copy compiled backend
COPY --from=backend-builder /app/dist ./dist

# Copy drizzle migrations
COPY --from=backend-builder /app/drizzle ./drizzle

# Copy built frontend assets to backend's public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Create directories for uploads and data
RUN mkdir -p uploads/avatars uploads/media data

ENV PORT=80
EXPOSE 80

CMD ["node", "dist/index.js"]

