// src/api/server.ts
import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { errorHandlerPlugin } from '@/api/plugins/error-handler';
import { loggingPlugin } from '@/api/plugins/logging';
import { authPlugin } from '@/api/plugins/auth';

import { registerHealthRoutes } from './routes/health';
import { registerAuthRoutes } from './routes/auth';
import { registerBusinessRoutes } from './routes/business';
import { registerClientRoutes } from './routes/client';
import { registerServiceRoutes } from './routes/service';
import { registerProjectRoutes } from './routes/project';
import { registerProjectInsightsRoutes } from './routes/project-insights';
import { registerProjectTaskRoutes } from './routes/project-task';
import { registerProjectWorkloadRoutes } from './routes/project-workload';
import { registerProjectGanttRoutes } from './routes/project-gantt';
import { registerQuoteRoutes } from './routes/quote';
import { registerInvoiceRoutes } from './routes/invoice';

import { registerPersonalAccountRoutes } from './routes/personal-account';
import { registerPersonalTransactionRoutes } from './routes/personal-transaction';
import { registerBusinessAccountRoutes } from './routes/business-account';
import { registerBusinessTransactionRoutes } from './routes/business-transaction';

import { registerPersonalBudgetRoutes } from './routes/personal-budget';
import { registerBusinessBudgetRoutes } from './routes/business-budget';

import { registerPersonalInsightsRoutes } from './routes/personal-insights';
import { registerPersonalInsightsIncomeRoutes } from './routes/personal-insights-income';
import { registerPersonalInsightsSpendingRoutes } from './routes/personal-insights-spending';
import { registerPersonalInsightsSeasonalityRoutes } from './routes/personal-insights-seasonality';
import { registerPersonalInsightsScoreRoutes } from './routes/personal-insights-score';
import { registerPersonalInsightsSavingsPlanRoutes } from './routes/personal-insights-savings';

import { registerBusinessInsightsClientsRoutes } from './routes/business-insights-clients';
import { registerBusinessInsightsServicesRoutes } from './routes/business-insights-services';
import { registerBusinessProjectsPerformanceRoutes } from './routes/business-projects-performance';
import { registerBusinessInsightsPipelineRoutes } from './routes/business-insights-pipeline';

import { registerPersonalOverviewRoutes } from './routes/personal-overview';


// Railway injecte automatiquement PORT
const PORT = Number(process.env.PORT ?? 3001);
await app.listen({ port: PORT, host: '0.0.0.0' });

async function buildServer() {
  const app = fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  // Zod ↔ Fastify
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ----------------------------
  // 🌍 CORS — compatible local + production
  // ----------------------------

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CORS_ORIGIN,           // ex: https://diwanbg.work
    process.env.NEXT_PUBLIC_APP_URL,   // fallback front prod
  ].filter(Boolean); // retire undefined

  await app.register(cors, {
    origin: (origin, cb) => {
      // Requêtes serveur → API (curl, Railway healthcheck)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });


  // ----------------------------
  // 📘 Swagger / OpenAPI
  // ----------------------------
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Lune API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });


  // ----------------------------
  // 🔌 Plugins globaux
  // ----------------------------
  await app.register(errorHandlerPlugin);
  await app.register(loggingPlugin);
  await app.register(authPlugin);


  // ----------------------------
  // 🚀 Routes
  // ----------------------------
  await registerHealthRoutes(app);
  await registerAuthRoutes(app);

  await registerBusinessRoutes(app);
  await registerClientRoutes(app);
  await registerServiceRoutes(app);
  await registerProjectRoutes(app);
  await registerProjectInsightsRoutes(app);
  await registerProjectTaskRoutes(app);
  await registerProjectWorkloadRoutes(app);
  await registerProjectGanttRoutes(app);

  await registerQuoteRoutes(app);
  await registerInvoiceRoutes(app);

  await app.register(registerPersonalAccountRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalTransactionRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalBudgetRoutes, { prefix: '/api/v1' });

  await app.register(registerPersonalInsightsRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalInsightsIncomeRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalInsightsSpendingRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalInsightsSeasonalityRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalInsightsScoreRoutes, { prefix: '/api/v1' });
  await app.register(registerPersonalInsightsSavingsPlanRoutes, { prefix: '/api/v1' });

  await registerBusinessInsightsClientsRoutes(app);
  await registerBusinessInsightsServicesRoutes(app);
  await registerBusinessProjectsPerformanceRoutes(app);
  await registerBusinessInsightsPipelineRoutes(app);

  await registerBusinessAccountRoutes(app);
  await registerBusinessTransactionRoutes(app);
  await registerBusinessBudgetRoutes(app);

  await app.register(registerPersonalOverviewRoutes, { prefix: '/api/v1' });

  return app;
}


// ----------------------------
// ▶️ Launch server
// ----------------------------
async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });

    app.log.info(`🚀 API live on port ${PORT}`);
    app.log.info(`📚 Swagger: /docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();