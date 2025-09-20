# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
# Ensure local .env does not leak into production build
RUN rm -f .env || true
# Ensure Vite will use runtime defaults (same-origin /api and ws)
ENV VITE_API_BASE_URL=
ENV VITE_WS_BASE_URL=

RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
