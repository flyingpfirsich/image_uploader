# Build Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build Backend & Serve
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
# Create uploads directory
RUN mkdir uploads
# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "server.js"]

