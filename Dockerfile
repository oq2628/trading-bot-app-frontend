# syntax=docker/dockerfile:1

# ---- builder -----------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /build

# npm ci needs both files and, unlike npm install, installs exactly the
# lockfile's tree -- which is what makes the image reproducible.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables at build time, so the API origin is baked into
# the bundle here rather than read at runtime. .env.production supplies the
# empty default (same origin, behind the reverse proxy); pass --build-arg
# VITE_API_BASE_URL=https://api.example.com to point the bundle elsewhere.
# vite.config.ts fails the build if the variable is undefined entirely.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- runtime -----------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
