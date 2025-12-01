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
