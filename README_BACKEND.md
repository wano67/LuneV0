Backend (Fastify / Prisma / Railway)
====================================

Commandes locales (prod-like)
-----------------------------
- Build TypeScript : `npm run build`
- Démarrage : `PORT=3001 DATABASE_URL="postgresql://user:pass@host:5432/db" npm run start:prod`
- Healthchecks :
  - API : `curl http://localhost:3001/api/v1/health`
  - DB  : `curl http://localhost:3001/api/v1/health/db`

Déploiement Railway (service backend)
-------------------------------------
- Fichier : `railway.backend.json` (builder `DOCKERFILE`, target `backend`).
- Le container utilise le `CMD` du Dockerfile : `node -r ./tsconfig-paths-bootstrap.js dist/api/server.js`.
- `startCommand` est laissé à `null` pour ne pas surcharger le `CMD`.
- Variables requises sur Railway :
  - `PORT=3001` (Railway le fournit)
  - `DATABASE_URL` (connexion Postgres Railway)
  - `NODE_ENV=production`
  - `JWT_SECRET` (secret de prod)
  - `CORS_ORIGIN` = URL publique du front (ex: `https://diwanbg.work`)
  - (optionnel) `NEXT_PUBLIC_APP_URL` si utilisé côté backend
  - Ne jamais utiliser une URL `localhost` en production (`DATABASE_URL` doit venir de Railway ou d’une base accessible publiquement).
- La racine contient un `package.json` avec `start:prod` (et `start` -> `start:prod`) utilisé en local; le Dockerfile copie ce `package.json` dans l’image backend.

Notes front
-----------
- `apps/web` doit définir `NEXT_PUBLIC_API_BASE_URL` pointant vers l’URL publique du backend Railway.
- `NEXT_PUBLIC_APP_URL` est l’URL publique du front (utile pour CORS côté backend).

Local Docker (docker compose)
-----------------------------
- Démarrage stack :  
  `docker compose down && docker compose up --build -d`
- Vérifier les conteneurs :  
  `docker ps | grep lunev0`
- Backend exposé sur `http://localhost:3002` (mapping 3002:3001) :  
  `curl http://localhost:3002/api/v1/health`  
  `curl http://localhost:3002/api/v1/health/db`
- Front Next.js sur `http://localhost:3001` (mapping 3001:3000). Assurez-vous que `NEXT_PUBLIC_API_BASE_URL` côté front pointe vers `http://localhost:3002`.

Production Railway (frontend)
-----------------------------
- Service frontend : définir
  - `NEXT_PUBLIC_API_BASE_URL` → URL publique du backend (ex: `https://<backend-railway-domain>`)
  - `NEXT_PUBLIC_APP_URL` → URL publique du front (ex: `https://diwanbg.work`)
  - Pas d’URL `localhost` en production.
