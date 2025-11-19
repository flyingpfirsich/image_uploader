# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the backend
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Copy built frontend assets to backend's public directory
COPY --from=frontend-builder /app/frontend/dist ./public

ENV PORT=80
EXPOSE 80

CMD ["node", "server.js"]

