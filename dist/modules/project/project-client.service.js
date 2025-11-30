"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectClientService = exports.ProjectClientService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class ProjectClientService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createProjectClient(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        let businessId = null;
        if (options.businessId !== undefined) {
            businessId = options.businessId === null ? null : (0, ids_1.normalizeBusinessId)(options.businessId);
            if (businessId !== null) {
                await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
            }
        }
        let linkedClientId = null;
        if (businessId !== null) {
            const existingClient = await this.prismaClient.clients.findFirst({
                where: {
                    business_id: businessId,
                    OR: [{ name: options.name }, ...(options.email ? [{ email: options.email }] : [])],
                },
                select: { id: true },
            });
            if (existingClient) {
                linkedClientId = existingClient.id;
            }
            else {
                const created = await this.prismaClient.clients.create({
                    data: {
                        business_id: businessId,
                        name: options.name,
                        contact_name: options.companyName ?? null,
                        email: options.email ?? null,
                        phone: options.phone ?? null,
                        billing_address: options.address ?? null,
                        shipping_address: null,
                        vat_number: options.vatNumber ?? null,
                        status: 'active',
                        notes: options.notes ?? null,
                    },
                });
                linkedClientId = created.id;
            }
        }
        const projectClient = await this.prismaClient.client.create({
            data: {
                user_id: userId,
                business_id: businessId,
                client_id: linkedClientId,
                name: options.name,
                type: options.type ?? 'company',
                email: options.email ?? null,
                phone: options.phone ?? null,
                company_name: options.companyName ?? null,
                vat_number: options.vatNumber ?? null,
                address: options.address ?? null,
                notes: options.notes ?? null,
            },
        });
        return projectClient;
    }
}
exports.ProjectClientService = ProjectClientService;
exports.projectClientService = new ProjectClientService(prisma_1.prisma);
