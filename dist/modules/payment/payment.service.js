"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsService = exports.PaymentsService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class PaymentsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async recordPayment(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        const businessId = (0, ids_1.normalizeBusinessId)(input.businessId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
        throw new Error('Not implemented yet');
    }
    async listPaymentsForInvoice(_invoiceId, userIdInput) {
        await (0, assertions_1.assertUserExists)(this.prismaClient, (0, ids_1.normalizeUserId)(userIdInput));
        throw new Error('Not implemented yet');
    }
}
exports.PaymentsService = PaymentsService;
exports.paymentsService = new PaymentsService(prisma_1.prisma);
