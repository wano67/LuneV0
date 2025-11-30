"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesService = exports.ServicesService = exports.ServiceNotFoundError = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
class ServiceNotFoundError extends Error {
    constructor(message = 'Service not found') {
        super(message);
        this.name = 'ServiceNotFoundError';
    }
}
exports.ServiceNotFoundError = ServiceNotFoundError;
const allowedUnits = ['project', 'day', 'hour', 'deliverable'];
const serviceSelect = {
    id: true,
    user_id: true,
    business_id: true,
    name: true,
    description: true,
    unit: true,
    unit_price: true,
    currency: true,
    is_active: true,
    created_at: true,
    updated_at: true,
};
function normalizeServiceName(name) {
    return name.trim().replace(/\s+/g, ' ').slice(0, 255);
}
function validateUnit(unit) {
    if (!allowedUnits.includes(unit)) {
        throw new Error('Invalid service unit');
    }
}
function validateCurrency(currency) {
    const trimmed = currency.trim();
    if (!trimmed || trimmed.length > 10) {
        throw new Error('Invalid currency');
    }
}
class ServicesService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createService(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        let businessId = null;
        if (input.businessId !== undefined) {
            businessId = input.businessId === null ? null : (0, ids_1.normalizeBusinessId)(input.businessId);
            if (businessId !== null) {
                await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
            }
        }
        const name = normalizeServiceName(input.name);
        validateUnit(input.unit);
        validateCurrency(input.currency);
        const created = await this.prismaClient.service.create({
            data: {
                user_id: userId,
                business_id: businessId,
                name,
                description: input.description ?? null,
                unit: input.unit,
                unit_price: new client_1.Prisma.Decimal(input.unitPrice),
                currency: input.currency,
                is_active: true,
            },
            select: serviceSelect,
        });
        return created;
    }
    async updateService(serviceIdInput, userIdInput, input) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const serviceId = (0, ids_1.normalizeServiceId)(serviceIdInput);
        const existing = await this.prismaClient.service.findUnique({
            where: { id: serviceId },
            select: serviceSelect,
        });
        if (!existing) {
            throw new ServiceNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new errors_1.ServiceOwnershipError();
        }
        const data = {};
        if (input.name !== undefined)
            data.name = normalizeServiceName(input.name);
        if (input.description !== undefined)
            data.description = input.description;
        if (input.unit !== undefined) {
            validateUnit(input.unit);
            data.unit = input.unit;
        }
        if (input.unitPrice !== undefined)
            data.unit_price = new client_1.Prisma.Decimal(input.unitPrice);
        if (input.currency !== undefined) {
            validateCurrency(input.currency);
            data.currency = input.currency;
        }
        if (input.isActive !== undefined)
            data.is_active = input.isActive;
        if (input.businessId !== undefined) {
            const businessId = input.businessId === null ? null : (0, ids_1.normalizeBusinessId)(input.businessId);
            if (businessId !== null) {
                await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
            }
            data.business_id = businessId;
        }
        const updated = await this.prismaClient.service.update({
            where: { id: serviceId },
            data,
            select: serviceSelect,
        });
        return updated;
    }
    async getServiceForUser(serviceIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const serviceId = (0, ids_1.normalizeServiceId)(serviceIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const service = await this.prismaClient.service.findUnique({
            where: { id: serviceId },
            select: serviceSelect,
        });
        if (!service) {
            throw new ServiceNotFoundError();
        }
        if (service.user_id !== userId) {
            throw new errors_1.ServiceOwnershipError();
        }
        return service;
    }
    async listServicesForUser(userIdInput, filters = {}) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const where = {
            user_id: userId,
        };
        if (filters.businessId !== undefined) {
            where.business_id = filters.businessId === null ? null : (0, ids_1.normalizeBusinessId)(filters.businessId);
        }
        if (filters.isActive !== undefined) {
            where.is_active = filters.isActive;
        }
        return this.prismaClient.service.findMany({
            where,
            select: serviceSelect,
            orderBy: { created_at: 'asc' },
        });
    }
    async archiveService(serviceIdInput, userIdInput) {
        return this.updateService(serviceIdInput, userIdInput, { isActive: false });
    }
    async deleteService(serviceIdInput, userIdInput) {
        const service = await this.getServiceForUser(serviceIdInput, userIdInput);
        await this.prismaClient.service.delete({ where: { id: service.id } });
    }
}
exports.ServicesService = ServicesService;
exports.servicesService = new ServicesService(prisma_1.prisma);
