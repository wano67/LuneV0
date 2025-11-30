"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessLateInvoicesRule = businessLateInvoicesRule;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
async function businessLateInvoicesRule(options) {
    const client = options.prismaClient ?? prisma_1.prisma;
    const userId = (0, ids_1.normalizeUserId)(options.userId);
    const businessId = (0, ids_1.normalizeBusinessId)(options.businessId);
    await (0, assertions_1.assertUserExists)(client, userId);
    await (0, assertions_1.assertBusinessOwnedByUser)(client, businessId, userId);
    const today = new Date();
    const lateInvoices = await client.invoices.findMany({
        where: {
            business_id: businessId,
            status: { in: ['issued', 'partially_paid'] },
            due_date: { lt: today },
        },
        select: {
            id: true,
            total_ttc: true,
            amount_paid_cached: true,
        },
    });
    if (lateInvoices.length === 0)
        return null;
    const totalLateAmount = lateInvoices.reduce((sum, inv) => {
        const remaining = new client_1.Prisma.Decimal(inv.total_ttc ?? 0).minus(inv.amount_paid_cached ?? 0);
        return sum.add(remaining);
    }, new client_1.Prisma.Decimal(0));
    const countLateInvoices = lateInvoices.length;
    const amountNumber = Number(totalLateAmount);
    const severity = countLateInvoices > 3 || amountNumber > 2000 ? 'critical' : 'warning';
    return {
        id: 'business-late-invoices',
        userId,
        businessId,
        category: 'cashflow',
        severity,
        title: 'Factures en retard',
        message: 'Vous avez des factures en retard de paiement.',
        data: {
            businessId,
            countLateInvoices,
            totalLateAmount: amountNumber,
        },
    };
}
