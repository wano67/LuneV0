########
# Multi-stage Dockerfile for Lune v2
# Targets:
#  - backend-build: compiles TypeScript backend
#  - backend: production backend image (Node 20)
#  - web-build: builds Next.js frontend
#  - web: production frontend image (Node 20)
########

########
# Build backend (TypeScript compile)
FROM node:20 AS backend-build
WORKDIR /app

# Copie des sources backend + Prisma
COPY package.json package-lock.json* tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Installe tout + génère Prisma Client + compile TS
RUN npm ci \
  && npx prisma generate \
  && npx tsc --project tsconfig.json --outDir dist


########
# Final backend image
FROM node:20-alpine AS backend
WORKDIR /app

# Dépendances de production uniquement
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copie des fichiers compilés + Prisma depuis le stage build
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Entrypoint backend (Railway utilisera npm run start:prod)
CMD ["node", "dist/api/server.js"]


########
# Build frontend (Next.js)
FROM node:20 AS web-build
WORKDIR /app/web

# Copie du frontend et installation des deps de build
COPY apps/web/package.json apps/web/package-lock.json* ./
COPY apps/web/tsconfig.json ./
COPY apps/web/next.config.js ./
COPY apps/web ./
RUN npm ci

# Build Next.js
RUN npm run build


########
# Final frontend image
FROM node:20-alpine AS web
WORKDIR /app/web

ENV NODE_ENV=production
ENV PORT=3000

# tini pour gérer les signaux proprement
RUN apk add --no-cache tini

# Assets de build copiés depuis le stage web-build
COPY --from=web-build /app/web/.next ./.next
COPY --from=web-build /app/web/public ./public
COPY --from=web-build /app/web/package.json ./package.json
COPY --from=web-build /app/web/package-lock.json ./package-lock.json

# Dépendances de prod uniquement pour Next.js
RUN npm ci --omit=dev

EXPOSE 3000

# Démarrage du frontend
CMD ["/sbin/tini", "--", "npm", "run", "start"]