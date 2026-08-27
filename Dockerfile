# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# API URL is baked into the client bundle at build time (NEXT_PUBLIC_*).
# Default to a SAME-ORIGIN relative path so the browser calls the Next server,
# which proxies to the backend (see next.config rewrites) — keeps the session
# cookie first-party. API_PROXY_TARGET is where those rewrites forward to.
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG API_PROXY_TARGET=http://backend:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV API_PROXY_TARGET=$API_PROXY_TARGET
RUN npm run build

# ---- Runtime stage (standalone) ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
