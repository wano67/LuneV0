# Lune Railway Readiness Audit

## Frontend routing review
- **Personal dashboard** (`apps/web/app/app/personal/page.tsx`): client-side page that fetches `/api/v1/personal/overview` with auth and exposes date filters, so it needs a reachable backend base URL and valid JWT cookies in the browser.
- **Business projects** (`apps/web/app/app/business/projects/page.tsx`): relies on `useActiveBusiness`, project + client hooks, and `businessActions.createProject`; ensure the business context is set before rendering or submissions will be disabled.
- **Business performance** (`apps/web/app/app/performance/page.tsx`): depends on pipeline/top-clients/services hooks and shows an empty state when no active business exists; keep the business selection flow working to avoid blank data.

## Clean-up performed
- Removed stray duplicates (`page 2.tsx`) in the performance and business projects routes. Their non-standard filenames could have produced confusing build-time routes in Next.js and are superseded by the real `page.tsx` files.
- Dropped an unused `package-lock 2.json` in `apps/web/` to prevent accidental dependency drift during installs/builds.

## Deployment compatibility
- The monorepo ships a multi-stage `Dockerfile` with distinct `backend` and `web` targets used by Railway configs (`railway.backend.json`, `railway.web.json`). Backend stage compiles TypeScript/Prisma to `dist`; the web stage builds the Next.js standalone server.
- Required env vars (see `.env.example`): `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`, plus `PORT` values (backend defaults to 3001, frontend to 3000). On Railway set the backend `PORT` to `3001` and expose the frontend on `3000` to match the Dockerfile defaults.
- The frontend HTTP helper (`apps/web/lib/api/http.ts`) throws when `NEXT_PUBLIC_API_BASE_URL` is missing; make sure it is set in Railway and when running `next build` locally to avoid runtime crashes.

## Suggested deployment steps
1. Provision PostgreSQL and propagate its URL to `DATABASE_URL` for the backend build and runtime.
2. Run `npx prisma migrate deploy` (or `prisma generate` + `migrate deploy`) against the production DB before starting the backend container.
3. Build and deploy two Railway services from this repo using the provided config files—`railway.backend.json` for the API and `railway.web.json` for the Next.js frontend.
4. Verify CORS: set `CORS_ORIGIN` on the backend to the public Railway frontend URL; set `NEXT_PUBLIC_API_BASE_URL` on the frontend to the backend URL.
5. Smoke-check the frontend after deployment by signing in and loading the personal dashboard, projects, and performance pages to ensure the auth context and API endpoints respond correctly.
