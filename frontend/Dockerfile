# ============================================
# DOCKERFILE FOR FRONTEND (React + Vite)
# ============================================
# This is a MULTI-STAGE build - we use 2 stages:
#   1. BUILD stage - compile React app
#   2. PRODUCTION stage - serve the compiled files
# This makes the final image MUCH smaller!

# ================== STAGE 1: BUILD ==================
# We name this stage "build" so we can reference it later
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
# We need devDependencies here because Vite is a dev tool
# Added registry and timeout settings to handle network issues
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Build the production bundle
# This creates a "dist" folder with optimized static files
# (HTML, CSS, JS - all minified and ready for production)
RUN npm run build

# ================== STAGE 2: PRODUCTION ==================
# Now we start fresh with a tiny web server image
# nginx:alpine is only ~20MB and serves static files fast!
FROM nginx:alpine AS production

# Copy the built files from Stage 1
# We ONLY copy the "dist" folder, not node_modules or source!
# This is why multi-stage builds are awesome - tiny final image!
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional but recommended)
# This handles React Router's client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (default HTTP port)
EXPOSE 80

# nginx starts automatically, but we'll be explicit
CMD ["nginx", "-g", "daemon off;"]
