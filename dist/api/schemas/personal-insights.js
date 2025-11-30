"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalInsightsOverviewSchema = exports.personalInsightsBudgetSnapshotSchema = exports.personalInsightsMonthlyPointSchema = void 0;
const zod_1 = require("zod");
exports.personalInsightsMonthlyPointSchema = zod_1.z.object({
    month: zod_1.z.string(), // "2025-12"
    income: zod_1.z.number(),
    spending: zod_1.z.number(),
    net: zod_1.z.number(),
});
exports.personalInsightsBudgetSnapshotSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    currency: zod_1.z.string(),
    amount: zod_1.z.number(),
    spent: zod_1.z.number(),
    remaining: zod_1.z.number(),
    consumptionRate: zod_1.z.number(),
    periodStart: zod_1.z.string(),
    periodEnd: zod_1.z.string(),
});
exports.personalInsightsOverviewSchema = zod_1.z.object({
    totalBalance: zod_1.z.number(),
    totalAccounts: zod_1.z.number(),
    baseCurrency: zod_1.z.string(),
    month: zod_1.z.string(),
    monthIncome: zod_1.z.number(),
    monthSpending: zod_1.z.number(),
    monthNet: zod_1.z.number(),
    last3Months: zod_1.z.array(exports.personalInsightsMonthlyPointSchema),
    budgets: zod_1.z.array(exports.personalInsightsBudgetSnapshotSchema),
    generatedAt: zod_1.z.string(),
});
