# ─── Stage 1: Compilar Angular ──────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Aumenta la memoria de Node para builds grandes
ENV NODE_OPTIONS=--max-old-space-size=4096

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala dependencias primero (caching de capas)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copia el código y compila en modo producción
COPY . .
RUN pnpm exec ng build --configuration=production

# ─── Stage 2: Servir con Nginx ──────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
