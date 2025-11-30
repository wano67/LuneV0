"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("@/modules/user/user.service");
const business_service_1 = require("@/modules/business/business.service");
const project_client_service_1 = require("@/modules/project/project-client.service");
const prisma_1 = require("@/lib/prisma");
async function main() {
    console.log('🔹 Project clients smoke test starting...');
    const ts = Date.now();
    const email = `projclient.user+${ts}@example.com`;
    const { user } = await user_service_1.userService.createUserWithDefaultSettings({
        email,
        passwordHash: 'dummy',
        displayName: 'Project Client User',
    });
    const business = await business_service_1.businessService.createBusinessWithDefaultSettings({
        userId: user.id,
        name: `Biz PC ${ts}`,
        legalForm: 'SASU',
        currency: 'EUR',
    });
    const pc1 = await project_client_service_1.projectClientService.createProjectClient({
        userId: user.id,
        businessId: business.business.id,
        name: `Client Projects ${ts}`,
        email: `client${ts}@example.com`,
    });
    const pc2 = await project_client_service_1.projectClientService.createProjectClient({
        userId: user.id,
        businessId: business.business.id,
        name: `Client Projects ${ts}`, // same name should reuse
        email: `client${ts}@example.com`,
    });
    const allClients = await prisma_1.prisma.clients.findMany({
        where: { business_id: business.business.id, name: `Client Projects ${ts}` },
    });
    console.log('✅ Project client linked to business client:', {
        projectClientId: pc1.id,
        clientId: pc1.client_id,
        clientCount: allClients.length,
    });
    if (!pc1.client_id || !pc2.client_id || pc1.client_id !== pc2.client_id) {
        throw new Error('Project clients should link to the same business client');
    }
    if (allClients.length !== 1) {
        throw new Error('Should have only one business client record');
    }
    console.log('✅ Project clients smoke test completed successfully.');
}
main().catch((err) => {
    console.error('❌ Project clients smoke test failed:', err);
    process.exit(1);
});
