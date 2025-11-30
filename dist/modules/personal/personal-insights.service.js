"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalInsightsService = exports.PersonalInsightsService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class PersonalInsightsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    getMonthKey(date) {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }
    startOfMonth(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
    }
    addMonths(date, delta) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1, 0, 0, 0, 0));
    }
    decimalToNumber(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        if (typeof value.toNumber === 'function')
            return value.toNumber();
        return Number(value);
    }
    computeSignedAmount(tx) {
        const base = this.decimalToNumber(tx.amount);
        return tx.direction === 'in' ? base : -base;
    }
    async getOverview(userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const now = new Date();
        const monthStart = this.startOfMonth(now);
        const nextMonthStart = this.addMonths(monthStart, 1);
        const accounts = (await this.prismaClient.accounts.findMany({
            where: {
                user_id: userId,
                business_id: null,
                is_active: true,
            },
            select: {
                id: true,
                user_id: true,
                business_id: true,
                currency: true,
                is_active: true,
            },
        }));
        const accountIds = accounts.map((a) => a.id);
        const baseCurrency = accounts[0]?.currency ?? 'EUR';
        const transactions = (await this.prismaClient.transactions.findMany({
            where: {
                user_id: userId,
                business_id: null,
                account_id: { in: accountIds.length ? accountIds : [BigInt(0)] },
            },
            select: {
                id: true,
                user_id: true,
                business_id: true,
                account_id: true,
                date: true,
                amount: true,
                direction: true,
                label: true,
                notes: true,
            },
            orderBy: { date: 'asc' },
        }));
        let totalBalance = 0;
        for (const tx of transactions) {
            totalBalance += this.computeSignedAmount(tx);
        }
        const totalAccounts = accounts.length;
        let monthIncome = 0;
        let monthSpending = 0;
        for (const tx of transactions) {
            if (tx.date >= monthStart && tx.date < nextMonthStart) {
                const amount = this.decimalToNumber(tx.amount);
                if (tx.direction === 'in') {
                    monthIncome += amount;
                }
                else {
                    monthSpending += amount;
                }
            }
        }
        const monthNet = monthIncome - monthSpending;
        const monthKey = this.getMonthKey(now);
        const last3Months = [];
        const monthBuckets = new Map();
        for (const tx of transactions) {
            const key = this.getMonthKey(tx.date);
            if (!monthBuckets.has(key)) {
                monthBuckets.set(key, { income: 0, spending: 0 });
            }
            const bucket = monthBuckets.get(key);
            const amount = this.decimalToNumber(tx.amount);
            if (tx.direction === 'in') {
                bucket.income += amount;
            }
            else {
                bucket.spending += amount;
            }
        }
        for (let i = 2; i >= 0; i--) {
            const d = this.addMonths(monthStart, -i);
            const key = this.getMonthKey(d);
            const bucket = monthBuckets.get(key) ?? { income: 0, spending: 0 };
            last3Months.push({
                month: key,
                income: bucket.income,
                spending: bucket.spending,
                net: bucket.income - bucket.spending,
            });
        }
        const budgets = (await this.prismaClient.budgets.findMany({
            where: {
                user_id: userId,
                business_id: null,
                status: 'active',
            },
            select: {
                id: true,
                user_id: true,
                business_id: true,
                name: true,
                currency: true,
                total_spending_limit: true,
                start_date: true,
                end_date: true,
                status: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { start_date: 'asc' },
        }));
        const budgetSnapshots = budgets.map((budget) => {
            const amount = this.decimalToNumber(budget.total_spending_limit ?? 0);
            const periodStart = budget.start_date ?? monthStart;
            const periodEnd = budget.end_date ?? nextMonthStart;
            let spent = 0;
            for (const tx of transactions) {
                if (tx.direction === 'out' && tx.date >= periodStart && tx.date <= periodEnd) {
                    spent += this.decimalToNumber(tx.amount);
                }
            }
            const remaining = Math.max(amount - spent, 0);
            const consumptionRate = amount > 0 ? spent / amount : 0;
            return {
                id: budget.id.toString(),
                userId: budget.user_id.toString(),
                name: budget.name ?? 'Budget',
                currency: budget.currency ?? baseCurrency,
                amount,
                spent,
                remaining,
                consumptionRate,
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                createdAt: budget.start_date?.toISOString() ?? new Date().toISOString(),
                updatedAt: budget.end_date?.toISOString() ?? new Date().toISOString(),
            };
        });
        return {
            totalBalance,
            totalAccounts,
            baseCurrency,
            month: monthKey,
            monthIncome,
            monthSpending,
            monthNet,
            last3Months,
            budgets: budgetSnapshots,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.PersonalInsightsService = PersonalInsightsService;
exports.personalInsightsService = new PersonalInsightsService(prisma_1.prisma);
