########
# Build backend (TypeScript + Prisma)
########
FROM node:20 AS backend-build
WORKDIR /app

# On garde un DATABASE_URL factice juste pour pouvoir générer Prisma
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=${DATABASE_URL}

# Copie des fichiers nécessaires au build
COPY package.json package-lock.json* ./
COPY tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Install + Prisma + compilation TypeScript (build prod)
RUN npm ci \
  && npx prisma generate \
  && npx tsc --project tsconfig.build.json --outDir dist

########
# Final backend image (prod) - use glibc base to match Prisma client built in backend-build
########
FROM node:20 AS backend
WORKDIR /app

# Dépendances de prod uniquement
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copie du code compilé + Prisma depuis le stage de build
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY tsconfig.build.json ./tsconfig.build.json

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Fastify backend
CMD ["node", "dist/api/server.js"]

########
# Build frontend (Next.js)
########
FROM node:20 AS web-build
WORKDIR /app

# Copie du frontend
COPY apps/web/package.json apps/web/package-lock.json* ./

# Install des dépendances
RUN npm ci

# Copie du code source
COPY apps/web ./

# Variables d'environnement nécessaires au build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build Next.js (output: standalone)
RUN npm run build

########
# Final frontend image (prod) - utilise le mode standalone de Next.js
########
FROM node:20-slim AS web
WORKDIR /app

# Copie le serveur standalone et les assets statiques
COPY --from=web-build /app/.next/standalone ./
COPY --from=web-build /app/.next/static ./.next/static
COPY --from=web-build /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Le serveur standalone est un fichier server.js à la racine
CMD ["node", "server.js"]
