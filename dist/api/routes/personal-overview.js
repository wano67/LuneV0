"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPersonalOverviewRoutes = registerPersonalOverviewRoutes;
const zod_1 = require("zod");
const personal_insights_service_1 = require("@/modules/personal/personal-insights.service");
const account_service_1 = require("@/modules/account/account.service");
const personal_transactions_service_1 = require("@/modules/personal/personal-transactions.service");
const personal_budgets_service_1 = require("@/modules/personal/personal-budgets.service");
const ids_1 = require("@/modules/shared/ids");
const dateOnlyStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD');
const overviewResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        summary: zod_1.z.object({
            totalNetWorth: zod_1.z.number(),
            totalCash: zod_1.z.number(),
            monthIncome: zod_1.z.number(),
            monthExpense: zod_1.z.number(),
            monthNetCashflow: zod_1.z.number(),
            currency: zod_1.z.string(),
        }),
        period: zod_1.z
            .object({
            from: zod_1.z.string().nullable(),
            to: zod_1.z.string().nullable(),
            income: zod_1.z.number(),
            expense: zod_1.z.number(),
            net: zod_1.z.number(),
            savingsRate: zod_1.z.number().nullable(),
        })
            .optional(),
        series: zod_1.z
            .array(zod_1.z.object({
            month: zod_1.z.string(),
            income: zod_1.z.number(),
            expense: zod_1.z.number(),
            net: zod_1.z.number(),
        }))
            .optional(),
        categories: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string(),
            total: zod_1.z.number(),
            count: zod_1.z.number(),
        }))
            .optional(),
        budgets: zod_1.z.object({
            activeBudget: zod_1.z
                .object({
                id: zod_1.z.string(),
                name: zod_1.z.string().nullable(),
                periodType: zod_1.z.string(),
                year: zod_1.z.number(),
                month: zod_1.z.number(),
                totalLimit: zod_1.z.number().nullable(),
                totalSpent: zod_1.z.number().nullable(),
                utilizationPct: zod_1.z.number().nullable(),
            })
                .nullable(),
        }),
        accounts: zod_1.z.object({
            topAccounts: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
                type: zod_1.z.string(),
                currency: zod_1.z.string(),
                balance: zod_1.z.number(),
                includeInNetWorth: zod_1.z.boolean(),
            })),
        }),
        transactions: zod_1.z.object({
            recent: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                date: zod_1.z.string(),
                label: zod_1.z.string(),
                amount: zod_1.z.number(),
                direction: zod_1.z.enum(['in', 'out']),
                accountName: zod_1.z.string(),
                categoryName: zod_1.z.string().nullable().optional(),
            })),
        }),
    }),
});
async function registerPersonalOverviewRoutes(app) {
    const server = app.withTypeProvider();
    server.route({
        method: 'GET',
        url: '/personal/overview',
        schema: {
            tags: ['Personal – Overview'],
            security: [{ bearerAuth: [] }],
            querystring: zod_1.z
                .object({
                from: dateOnlyStringSchema.optional(),
                to: dateOnlyStringSchema.optional(),
            })
                .optional(),
            response: {
                200: overviewResponseSchema,
            },
        },
        preHandler: app.authenticate,
        async handler(request, reply) {
            const userId = (0, ids_1.normalizeUserId)(BigInt(request.user.id ?? request.user.sub));
            const fromDate = request.query?.from ? new Date(`${request.query.from}T00:00:00.000Z`) : undefined;
            const toDate = request.query?.to ? new Date(`${request.query.to}T23:59:59.999Z`) : undefined;
            const txFilters = {
                accountId: undefined,
                dateFrom: fromDate,
                dateTo: toDate,
                direction: undefined,
            };
            const [insights, accounts, txs, budgets] = await Promise.all([
                personal_insights_service_1.personalInsightsService.getOverview(userId),
                account_service_1.accountService.listPersonalAccountsForUser(userId, { includeInactive: false }),
                personal_transactions_service_1.personalTransactionsService.list(userId, txFilters),
                personal_budgets_service_1.personalBudgetsService.listForUser(userId),
            ]);
            const now = new Date();
            const month = now.getUTCMonth() + 1;
            const year = now.getUTCFullYear();
            const activeBudget = budgets.find((b) => {
                const start = b.start_date ? b.start_date.getUTCMonth() + 1 : null;
                const startYear = b.start_date ? b.start_date.getUTCFullYear() : null;
                return start === month && startYear === year;
            });
            const income = txs.filter((t) => t.direction === 'in').reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
            const expense = txs.filter((t) => t.direction === 'out').reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
            const net = income - expense;
            const savingsRate = income > 0 ? net / income : null;
            const categoryBreakdown = txs
                .filter((t) => t.direction === 'out')
                .reduce((acc, tx) => {
                const key = tx.notes ?? tx.label ?? 'Uncategorized';
                if (!acc[key])
                    acc[key] = { total: 0, count: 0 };
                acc[key].total += Number(tx.amount ?? 0);
                acc[key].count += 1;
                return acc;
            }, {});
            const monthlySeries = txs.reduce((acc, tx) => {
                const d = tx.date ?? tx.date;
                const monthKey = `${tx.date.getUTCFullYear()}-${String(tx.date.getUTCMonth() + 1).padStart(2, '0')}`;
                if (!acc[monthKey])
                    acc[monthKey] = { income: 0, expense: 0 };
                if (tx.direction === 'in')
                    acc[monthKey].income += Number(tx.amount ?? 0);
                if (tx.direction === 'out')
                    acc[monthKey].expense += Number(tx.amount ?? 0);
                return acc;
            }, {});
            const monthlySeriesArray = Object.entries(monthlySeries)
                .sort(([a], [b]) => (a > b ? 1 : -1))
                .map(([monthKey, values]) => ({
                month: monthKey,
                income: values.income,
                expense: values.expense,
                net: values.income - values.expense,
            }));
            const categoryArray = Object.entries(categoryBreakdown).map(([name, values]) => ({
                name,
                total: values.total,
                count: values.count,
            }));
            return reply.send({
                data: {
                    summary: {
                        totalNetWorth: insights.totalBalance ?? 0,
                        totalCash: insights.totalBalance ?? 0,
                        monthIncome: insights.monthIncome ?? income,
                        monthExpense: insights.monthSpending ?? expense,
                        monthNetCashflow: insights.monthNet ?? net,
                        currency: insights.baseCurrency ?? 'EUR',
                    },
                    period: {
                        from: fromDate ? fromDate.toISOString() : null,
                        to: toDate ? toDate.toISOString() : null,
                        income,
                        expense,
                        net,
                        savingsRate,
                    },
                    series: monthlySeriesArray,
                    categories: categoryArray,
                    budgets: {
                        activeBudget: activeBudget
                            ? {
                                id: activeBudget.id.toString(),
                                name: activeBudget.name ?? null,
                                periodType: 'monthly',
                                year,
                                month,
                                totalLimit: activeBudget.total_spending_limit ? Number(activeBudget.total_spending_limit) : null,
                                totalSpent: null,
                                utilizationPct: null,
                            }
                            : null,
                    },
                    accounts: {
                        topAccounts: accounts
                            .slice(0, 3)
                            .map((a) => ({
                            id: a.id.toString(),
                            name: a.name,
                            type: a.type,
                            currency: a.currency ?? 'EUR',
                            balance: 0,
                            includeInNetWorth: a.include_in_net_worth,
                        })),
                    },
                    transactions: {
                        recent: txs.slice(0, 5).map((t) => ({
                            id: t.id.toString(),
                            date: t.date.toISOString(),
                            label: t.label,
                            amount: Number(t.amount),
                            direction: t.direction,
                            accountName: accounts.find((a) => a.id === t.account_id)?.name ?? 'Account',
                            categoryName: t.notes ?? null,
                        })),
                    },
                },
            });
        },
    });
}
