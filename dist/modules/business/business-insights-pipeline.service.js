"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessInsightsPipelineService = exports.BusinessInsightsPipelineService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
function daysBetween(start, end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return (end.getTime() - start.getTime()) / msPerDay;
}
class BusinessInsightsPipelineService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async getPipeline(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        const quotes = await this.prismaClient.quotes.findMany({
            where: { business_id: businessId },
            select: {
                id: true,
                status: true,
                issue_date: true,
                valid_until: true,
                total_ttc: true,
                updated_at: true,
            },
            orderBy: { issue_date: 'desc' },
        });
        let quoteCount = 0;
        let acceptedCount = 0;
        let totalQuoted = 0;
        let totalAccepted = 0;
        let timeToAcceptSum = 0;
        let timeToAcceptCount = 0;
        for (const q of quotes) {
            quoteCount += 1;
            totalQuoted += Number(q.total_ttc ?? 0);
            if (q.status === 'accepted') {
                acceptedCount += 1;
                totalAccepted += Number(q.total_ttc ?? 0);
                const acceptDate = q.updated_at ?? new Date();
                const issueDate = q.issue_date ?? acceptDate;
                timeToAcceptSum += daysBetween(issueDate, acceptDate);
                timeToAcceptCount += 1;
            }
        }
        const conversionRate = quoteCount > 0 ? acceptedCount / quoteCount : 0;
        const avgTimeToAcceptDays = timeToAcceptCount > 0 ? timeToAcceptSum / timeToAcceptCount : 0;
        return {
            businessId: businessId.toString(),
            quoteCount,
            acceptedCount,
            conversionRate,
            avgTimeToAcceptDays,
            totalQuoted,
            totalAccepted,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.BusinessInsightsPipelineService = BusinessInsightsPipelineService;
exports.businessInsightsPipelineService = new BusinessInsightsPipelineService(prisma_1.prisma);
