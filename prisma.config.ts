import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/lunev0';

if (!process.env.DATABASE_URL) {
  console.warn(
    'DATABASE_URL is not set. Falling back to a local Postgres connection for Prisma commands.',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
