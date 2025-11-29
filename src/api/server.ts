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

const PORT = Number(process.env.PORT ?? 3001);

async function buildServer() {
  const app = fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  // Zod <-> Fastify
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Enable CORS explicitly for dev (allow local frontend & common methods)
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.1.41:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger / OpenAPI (UN SEUL register(swagger))
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
      tags: [
        // Fondations
        { name: 'Health', description: 'Service uptime and diagnostics' },
        { name: 'Auth', description: 'Authentication and user session endpoints' },

        // Espace perso
        {
          name: 'Personal – Accounts',
          description: 'Personal cash/bank accounts',
        },
        {
          name: 'Personal – Transactions',
          description: 'Transactions on personal accounts',
        },
        {
          name: 'Personal – Budgets',
          description: 'Budgets on personal cashflow',
        },
        {
          name: 'Personal – Insights',
          description: 'Aggregated KPIs for personal finances',
        },

        // Espace business – core
        {
          name: 'Business – Core',
          description: 'Business creation, profile and settings',
        },
        {
          name: 'Business – Clients',
          description: 'Clients managed under a business',
        },
        {
          name: 'Business – Services',
          description: 'Catalog of services offered by a business',
        },
        {
          name: 'Business – Projects',
          description: 'Projects tracking for business work',
        },
        {
          name: 'Business – Project Tasks',
          description: 'Tasks and planning items inside business projects',
        },
        {
          name: 'Business – Project Insights',
          description: 'KPIs, planning and progress analytics for projects (overview, gantt, workload)',
        },

        // Espace business – sales
        {
          name: 'Business – Quotes',
          description: 'Quotes lifecycle (draft, sent, accepted, etc.)',
        },
        {
          name: 'Business – Invoices',
          description: 'Invoices issuance and retrieval',
        },
        {
          name: 'Business – Payments',
          description: 'Payments applied to invoices',
        },

        // Espace business – finance
        {
          name: 'Business – Accounts',
          description: 'Cash/bank accounts tied to a business',
        },
        {
          name: 'Business – Transactions',
          description: 'Transactions on business accounts',
        },
        {
          name: 'Business – Budgets',
          description: 'Budgets defined at business level',
        },

        // Espace business – insights globaux (à venir)
        {
          name: 'Business – Insights',
          description: 'Aggregated KPIs for business performance (clients, projects, revenue, etc.)',
        },
        {
          name: 'Business – Revenue Insights',
          description: 'Revenue and profitability analytics by clients, services, etc.',
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Plugins globaux
  await app.register(errorHandlerPlugin);
  await app.register(loggingPlugin);
  await app.register(authPlugin);

  // Routes
  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerBusinessRoutes(app);
  await registerClientRoutes(app);
  await registerServiceRoutes(app);
  await registerProjectRoutes(app);
  await registerProjectInsightsRoutes(app);
  await registerProjectWorkloadRoutes(app);
  await registerProjectGanttRoutes(app);
  await registerProjectTaskRoutes(app);
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

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 API server listening on http://localhost:${PORT}`);
    app.log.info(`📚 Swagger docs on http://localhost:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
