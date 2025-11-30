"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/server.ts
const fastify_1 = __importDefault(require("fastify"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const error_handler_1 = require("@/api/plugins/error-handler");
const logging_1 = require("@/api/plugins/logging");
const auth_1 = require("@/api/plugins/auth");
const health_1 = require("./routes/health");
const auth_2 = require("./routes/auth");
const business_1 = require("./routes/business");
const client_1 = require("./routes/client");
const service_1 = require("./routes/service");
const project_1 = require("./routes/project");
const project_insights_1 = require("./routes/project-insights");
const project_task_1 = require("./routes/project-task");
const project_workload_1 = require("./routes/project-workload");
const project_gantt_1 = require("./routes/project-gantt");
const quote_1 = require("./routes/quote");
const invoice_1 = require("./routes/invoice");
const personal_account_1 = require("./routes/personal-account");
const personal_transaction_1 = require("./routes/personal-transaction");
const business_account_1 = require("./routes/business-account");
const business_transaction_1 = require("./routes/business-transaction");
const personal_budget_1 = require("./routes/personal-budget");
const business_budget_1 = require("./routes/business-budget");
const personal_insights_1 = require("./routes/personal-insights");
const personal_insights_income_1 = require("./routes/personal-insights-income");
const personal_insights_spending_1 = require("./routes/personal-insights-spending");
const personal_insights_seasonality_1 = require("./routes/personal-insights-seasonality");
const personal_insights_score_1 = require("./routes/personal-insights-score");
const personal_insights_savings_1 = require("./routes/personal-insights-savings");
const business_insights_clients_1 = require("./routes/business-insights-clients");
const business_insights_services_1 = require("./routes/business-insights-services");
const business_projects_performance_1 = require("./routes/business-projects-performance");
const business_insights_pipeline_1 = require("./routes/business-insights-pipeline");
const personal_overview_1 = require("./routes/personal-overview");
const PORT = Number(process.env.PORT ?? 3001);
async function buildServer() {
    const app = (0, fastify_1.default)({
        logger: true,
    }).withTypeProvider();
    // Zod <-> Fastify
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    // Enable CORS explicitly for dev (allow local frontend & common methods)
    await app.register(cors_1.default, {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.1.41:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    // Swagger / OpenAPI (UN SEUL register(swagger))
    await app.register(swagger_1.default, {
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
        transform: fastify_type_provider_zod_1.jsonSchemaTransform,
    });
    await app.register(swagger_ui_1.default, {
        routePrefix: '/docs',
    });
    // Plugins globaux
    await app.register(error_handler_1.errorHandlerPlugin);
    await app.register(logging_1.loggingPlugin);
    await app.register(auth_1.authPlugin);
    // Routes
    await (0, health_1.registerHealthRoutes)(app);
    await (0, auth_2.registerAuthRoutes)(app);
    await (0, business_1.registerBusinessRoutes)(app);
    await (0, client_1.registerClientRoutes)(app);
    await (0, service_1.registerServiceRoutes)(app);
    await (0, project_1.registerProjectRoutes)(app);
    await (0, project_insights_1.registerProjectInsightsRoutes)(app);
    await (0, project_workload_1.registerProjectWorkloadRoutes)(app);
    await (0, project_gantt_1.registerProjectGanttRoutes)(app);
    await (0, project_task_1.registerProjectTaskRoutes)(app);
    await (0, quote_1.registerQuoteRoutes)(app);
    await (0, invoice_1.registerInvoiceRoutes)(app);
    await app.register(personal_account_1.registerPersonalAccountRoutes, { prefix: '/api/v1' });
    await app.register(personal_transaction_1.registerPersonalTransactionRoutes, { prefix: '/api/v1' });
    await app.register(personal_budget_1.registerPersonalBudgetRoutes, { prefix: '/api/v1' });
    await app.register(personal_insights_1.registerPersonalInsightsRoutes, { prefix: '/api/v1' });
    await app.register(personal_insights_income_1.registerPersonalInsightsIncomeRoutes, { prefix: '/api/v1' });
    await app.register(personal_insights_spending_1.registerPersonalInsightsSpendingRoutes, { prefix: '/api/v1' });
    await app.register(personal_insights_seasonality_1.registerPersonalInsightsSeasonalityRoutes, { prefix: '/api/v1' });
    await app.register(personal_insights_score_1.registerPersonalInsightsScoreRoutes, { prefix: '/api/v1' });
    await app.register(personal_insights_savings_1.registerPersonalInsightsSavingsPlanRoutes, { prefix: '/api/v1' });
    await (0, business_insights_clients_1.registerBusinessInsightsClientsRoutes)(app);
    await (0, business_insights_services_1.registerBusinessInsightsServicesRoutes)(app);
    await (0, business_projects_performance_1.registerBusinessProjectsPerformanceRoutes)(app);
    await (0, business_insights_pipeline_1.registerBusinessInsightsPipelineRoutes)(app);
    await (0, business_account_1.registerBusinessAccountRoutes)(app);
    await (0, business_transaction_1.registerBusinessTransactionRoutes)(app);
    await (0, business_budget_1.registerBusinessBudgetRoutes)(app);
    await app.register(personal_overview_1.registerPersonalOverviewRoutes, { prefix: '/api/v1' });
    return app;
}
async function start() {
    const app = await buildServer();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`🚀 API server listening on http://localhost:${PORT}`);
        app.log.info(`📚 Swagger docs on http://localhost:${PORT}/docs`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
