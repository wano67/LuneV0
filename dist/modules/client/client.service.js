"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientService = exports.ClientService = exports.ClientNotFoundError = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
class ClientNotFoundError extends Error {
    constructor(message = 'Client not found') {
        super(message);
        this.name = 'ClientNotFoundError';
    }
}
exports.ClientNotFoundError = ClientNotFoundError;
const clientSelect = {
    id: true,
    user_id: true,
    business_id: true,
    name: true,
    type: true,
    email: true,
    phone: true,
    company_name: true,
    vat_number: true,
    address: true,
    notes: true,
    created_at: true,
    updated_at: true,
};
function normalizeClientName(name) {
    return name.trim().replace(/\s+/g, ' ').slice(0, 255);
}
function validateClientType(type) {
    if (type !== 'individual' && type !== 'company') {
        throw new Error('Invalid client type');
    }
}
class ClientService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createClient(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        let businessId = null;
        if (input.businessId !== undefined) {
            businessId = input.businessId === null ? null : (0, ids_1.normalizeBusinessId)(input.businessId);
            if (businessId !== null) {
                await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
            }
        }
        const name = normalizeClientName(input.name);
        if (!name) {
            throw new Error('Client name is required');
        }
        validateClientType(input.type);
        const created = await this.prismaClient.client.create({
            data: {
                user_id: userId,
                business_id: businessId,
                name,
                type: input.type,
                email: input.email ?? null,
                phone: input.phone ?? null,
                company_name: input.companyName ?? null,
                vat_number: input.vatNumber ?? null,
                address: input.address ?? null,
                notes: input.notes ?? null,
            },
            select: clientSelect,
        });
        return created;
    }
    async updateClient(clientIdInput, userIdInput, input) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const clientId = (0, ids_1.normalizeClientId)(clientIdInput);
        const existing = await this.prismaClient.client.findUnique({
            where: { id: clientId },
            select: clientSelect,
        });
        if (!existing) {
            throw new ClientNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new errors_1.ClientOwnershipError();
        }
        const data = {};
        if (input.name !== undefined) {
            const name = normalizeClientName(input.name);
            if (!name) {
                throw new Error('Client name is required');
            }
            data.name = name;
        }
        if (input.type !== undefined) {
            validateClientType(input.type);
            data.type = input.type;
        }
        if (input.email !== undefined)
            data.email = input.email;
        if (input.phone !== undefined)
            data.phone = input.phone;
        if (input.companyName !== undefined)
            data.company_name = input.companyName;
        if (input.vatNumber !== undefined)
            data.vat_number = input.vatNumber;
        if (input.address !== undefined)
            data.address = input.address;
        if (input.notes !== undefined)
            data.notes = input.notes;
        if (input.businessId !== undefined) {
            const businessId = input.businessId === null ? null : (0, ids_1.normalizeBusinessId)(input.businessId);
            if (businessId !== null) {
                await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
            }
            data.business_id = businessId;
        }
        const updated = await this.prismaClient.client.update({
            where: { id: clientId },
            data,
            select: clientSelect,
        });
        return updated;
    }
    async listClientsForUser(userIdInput, filters = {}) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const where = {
            user_id: userId,
        };
        if (filters.businessId !== undefined) {
            where.business_id = filters.businessId === null ? null : (0, ids_1.normalizeBusinessId)(filters.businessId);
        }
        const clients = await this.prismaClient.client.findMany({
            where,
            select: clientSelect,
            orderBy: { created_at: 'asc' },
        });
        return clients;
    }
    async getClientForUser(clientIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const clientId = (0, ids_1.normalizeClientId)(clientIdInput);
        const client = await this.prismaClient.client.findUnique({
            where: { id: clientId },
            select: clientSelect,
        });
        if (!client) {
            throw new ClientNotFoundError();
        }
        if (client.user_id !== userId) {
            throw new errors_1.ClientOwnershipError();
        }
        return client;
    }
    async deleteClient(clientIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const clientId = (0, ids_1.normalizeClientId)(clientIdInput);
        const existing = await this.prismaClient.client.findUnique({
            where: { id: clientId },
            select: { id: true, user_id: true },
        });
        if (!existing) {
            throw new ClientNotFoundError();
        }
        if (existing.user_id !== userId) {
            throw new errors_1.ClientOwnershipError();
        }
        await this.prismaClient.client.delete({ where: { id: clientId } });
    }
}
exports.ClientService = ClientService;
exports.clientService = new ClientService(prisma_1.prisma);
