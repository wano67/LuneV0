########
# Multi-stage Dockerfile for Lune
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

# Dépendances de prod uniquement
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copie du code compilé + Prisma depuis le stage de build
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY tsconfig.json ./tsconfig.json
COPY tsconfig-paths-bootstrap.js ./tsconfig-paths-bootstrap.js

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# (Railway override avec startCommand, mais on garde un CMD par défaut)
CMD ["node", "-r", "./tsconfig-paths-bootstrap.js", "dist/api/server.js"]

########
# Build frontend (Next.js)
FROM node:20 AS web-build
WORKDIR /app/web

# Copie du frontend et install
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

RUN apk add --no-cache tini

COPY --from=web-build /app/web/.next ./.next
COPY --from=web-build /app/web/public ./public
COPY --from=web-build /app/web/package.json ./package.json
COPY --from=web-build /app/web/package-lock.json ./package-lock.json

RUN npm ci --omit=dev

EXPOSE 3000

CMD ["/sbin/tini", "--", "npm", "run", "start"]