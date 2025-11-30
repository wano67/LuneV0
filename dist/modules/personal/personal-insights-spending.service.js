"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalInsightsSpendingService = exports.PersonalInsightsSpendingService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const parseDate = (value) => {
    if (!value)
        return undefined;
    return new Date(`${value}T00:00:00.000Z`);
};
class PersonalInsightsSpendingService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    defaultRange() {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        return { start, end };
    }
    async spendingByCategory(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const { start: defaultFrom, end: defaultTo } = this.defaultRange();
        const from = parseDate(options.from) ?? defaultFrom;
        const to = parseDate(options.to) ?? defaultTo;
        const transactions = await this.prismaClient.transactions.findMany({
            where: {
                user_id: userId,
                business_id: null,
                direction: 'out',
                date: { gte: from, lte: to },
            },
            select: {
                id: true,
                amount: true,
                raw_label: true,
                categories: {
                    select: { name: true },
                },
            },
        });
        let totalSpending = 0;
        const buckets = new Map();
        for (const tx of transactions) {
            const amount = Number(tx.amount ?? 0);
            totalSpending += amount;
            const key = tx.categories?.name ?? 'Uncategorized';
            const bucket = buckets.get(key) ?? { total: 0, count: 0 };
            bucket.total += amount;
            bucket.count += 1;
            buckets.set(key, bucket);
        }
        const categories = Array.from(buckets.entries()).map(([category, data]) => ({
            category,
            total: data.total,
            transactionCount: data.count,
            shareOfSpending: totalSpending > 0 ? data.total / totalSpending : 0,
        }));
        categories.sort((a, b) => b.total - a.total);
        const topCategory = categories.length > 0 ? categories[0].category : null;
        return {
            period: { from: from.toISOString(), to: to.toISOString() },
            currency: 'EUR',
            categories,
            topCategory,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.PersonalInsightsSpendingService = PersonalInsightsSpendingService;
exports.personalInsightsSpendingService = new PersonalInsightsSpendingService(prisma_1.prisma);
