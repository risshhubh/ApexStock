# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configurations
COPY package.json ./

# Install all packages
RUN npm install

# Copy application files
COPY . .

# Build Vite application to static HTML/JS/CSS assets
RUN npm run build

# --- Stage 2: Serve Stage ---
FROM nginx:stable-alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
