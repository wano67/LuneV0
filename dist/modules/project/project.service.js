"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsService = exports.ProjectsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const errors_1 = require("@/modules/shared/errors");
const projectSelect = {
    id: true,
    user_id: true,
    business_id: true,
    client_id: true,
    name: true,
    description: true,
    status: true,
    start_date: true,
    due_date: true,
    completed_at: true,
    budget_amount: true,
    currency: true,
    priority: true,
    progress_manual_pct: true,
    progress_auto_mode: true,
    created_at: true,
    updated_at: true,
};
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
const baseServiceSelect = {
    id: true,
    user_id: true,
    business_id: true,
    name: true,
    description: true,
    unit: true,
    unit_price: true,
    currency: true,
    is_active: true,
};
const projectServiceSelect = {
    id: true,
    project_id: true,
    service_id: true,
    quantity: true,
    custom_label: true,
    unit_price: true,
    total_price: true,
    created_at: true,
    updated_at: true,
    service: { select: baseServiceSelect },
};
const milestoneSelect = {
    id: true,
    project_id: true,
    name: true,
    description: true,
    due_date: true,
    status: true,
    order_index: true,
    weight_pct: true,
    created_at: true,
    updated_at: true,
};
const taskSelect = {
    id: true,
    project_id: true,
    name: true,
    description: true,
    status: true,
    start_date: true,
    due_date: true,
    completed_at: true,
    progress_pct: true,
    sort_index: true,
    estimated_hours: true,
    actual_hours: true,
    created_at: true,
    updated_at: true,
};
function normalizeProjectName(name) {
    return name.trim().replace(/\s+/g, ' ').slice(0, 255);
}
function validateStatus(status) {
    const allowed = ['draft', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
        throw new Error('Invalid project status');
    }
}
function validatePriority(priority) {
    const allowed = ['low', 'normal', 'high'];
    if (!allowed.includes(priority)) {
        throw new Error('Invalid project priority');
    }
}
function clampProgress(value) {
    if (Number.isNaN(value))
        return 0;
    if (value < 0)
        return 0;
    if (value > 150)
        return 150;
    return value;
}
class ProjectsService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createProject(input) {
        const userId = (0, ids_1.normalizeUserId)(input.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        let businessId = null;
        if (input.businessId !== undefined) {
            businessId = input.businessId === null ? null : (0, ids_1.normalizeBusinessId)(input.businessId);
            if (businessId !== null) {
                await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
            }
        }
        const name = normalizeProjectName(input.name);
        if (!name) {
            throw new Error('Project name is required');
        }
        let client = null;
        if (input.clientId !== undefined && input.clientId !== null) {
            client = await this.prismaClient.client.findUnique({
                where: { id: (0, ids_1.normalizeClientId)(input.clientId) },
                select: clientSelect,
            });
            if (!client)
                throw new errors_1.ClientOwnershipError('Client not found');
            if (client.user_id !== userId)
                throw new errors_1.ClientOwnershipError();
            if (businessId && client.business_id !== null && client.business_id !== businessId) {
                throw new errors_1.ClientOwnershipError('Client does not belong to this business');
            }
        }
        let currency = input.currency?.trim();
        if (!currency) {
            if (businessId) {
                const business = await (0, assertions_1.assertBusinessOwnedByUser)(this.prismaClient, businessId, userId);
                currency = business.currency ?? 'EUR';
            }
            else {
                const settings = await this.prismaClient.user_settings.findUnique({
                    where: { user_id: userId },
                    select: { main_currency: true },
                });
                currency = settings?.main_currency ?? 'EUR';
            }
        }
        const status = input.status ?? 'planned';
        const priority = input.priority ?? 'normal';
        validateStatus(status);
        validatePriority(priority);
        let budgetAmount = input.budgetAmount ? new client_1.Prisma.Decimal(input.budgetAmount) : null;
        const serviceSnapshots = [];
        if (input.services && input.services.length > 0) {
            const serviceIds = input.services.map((s) => s.serviceId);
            const services = await this.prismaClient.service.findMany({
                where: { id: { in: serviceIds }, user_id: userId },
                select: baseServiceSelect,
            });
            if (services.length !== serviceIds.length) {
                throw new errors_1.ServiceOwnershipError('One or more services not found or not owned by user');
            }
            for (const svcInput of input.services) {
                const svc = services.find((s) => s.id === svcInput.serviceId);
                if (!svc)
                    continue;
                if (businessId && svc.business_id !== null && svc.business_id !== businessId) {
                    throw new errors_1.ServiceOwnershipError('Service not attached to this business');
                }
                const quantity = new client_1.Prisma.Decimal(svcInput.quantity);
                const unitPrice = new client_1.Prisma.Decimal(svc.unit_price);
                const totalPrice = unitPrice.mul(quantity);
                serviceSnapshots.push({
                    project_id: BigInt(0), // placeholder, set after project creation
                    service_id: svc.id,
                    quantity,
                    custom_label: svcInput.customLabel ?? svc.name,
                    unit_price: unitPrice,
                    total_price: totalPrice,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
            if (!budgetAmount) {
                budgetAmount = serviceSnapshots
                    .reduce((sum, snap) => sum.plus(snap.total_price), new client_1.Prisma.Decimal(0));
            }
        }
        const createdProject = await this.prismaClient.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    user_id: userId,
                    business_id: businessId,
                    client_id: client?.id ?? null,
                    name,
                    description: input.description ?? null,
                    status,
                    start_date: input.startDate ?? null,
                    due_date: input.dueDate ?? null,
                    completed_at: null,
                    budget_amount: budgetAmount,
                    currency,
                    priority,
                    progress_manual_pct: null,
                    progress_auto_mode: null,
                },
                select: projectSelect,
            });
            if (serviceSnapshots.length > 0) {
                for (const snapshot of serviceSnapshots) {
                    await tx.projectService.create({
                        data: {
                            ...snapshot,
                            project_id: project.id,
                        },
                    });
                }
            }
            return project;
        });
        return this.getProjectWithDetails(createdProject.id, userId);
    }
    async updateProject(projectIdInput, userIdInput, input) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const existing = await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectIdInput, userId);
        const data = {};
        if (input.name !== undefined)
            data.name = normalizeProjectName(input.name);
        if (input.description !== undefined)
            data.description = input.description;
        if (input.startDate !== undefined)
            data.start_date = input.startDate;
        if (input.dueDate !== undefined)
            data.due_date = input.dueDate;
        if (input.completedAt !== undefined)
            data.completed_at = input.completedAt;
        if (input.priority !== undefined) {
            validatePriority(input.priority);
            data.priority = input.priority;
        }
        if (input.status !== undefined) {
            validateStatus(input.status);
            data.status = input.status;
            if (input.status === 'completed' && data.completed_at === undefined && !existing.completed_at) {
                data.completed_at = new Date();
            }
        }
        if (input.budgetAmount !== undefined) {
            data.budget_amount = input.budgetAmount === null ? null : new client_1.Prisma.Decimal(input.budgetAmount);
        }
        if (input.progressManualPct !== undefined) {
            data.progress_manual_pct = input.progressManualPct;
        }
        if (input.progressAutoMode !== undefined) {
            data.progress_auto_mode = input.progressAutoMode;
        }
        if (input.clientId !== undefined) {
            if (input.clientId === null) {
                data.client_id = null;
            }
            else {
                const client = await this.prismaClient.client.findUnique({
                    where: { id: (0, ids_1.normalizeClientId)(input.clientId) },
                    select: clientSelect,
                });
                if (!client)
                    throw new errors_1.ClientOwnershipError('Client not found');
                if (client.user_id !== userId)
                    throw new errors_1.ClientOwnershipError();
                if (existing.business_id && client.business_id && client.business_id !== existing.business_id) {
                    throw new errors_1.ClientOwnershipError('Client does not belong to this business');
                }
                data.client_id = client.id;
            }
        }
        if (input.currency !== undefined) {
            const currency = input.currency.trim();
            if (!currency) {
                throw new Error('Currency is required');
            }
            data.currency = currency;
        }
        await this.prismaClient.project.update({
            where: { id: existing.id },
            data,
        });
        return this.getProjectWithDetails(existing.id, userId);
    }
    async listProjectsForUser(userIdInput, filters = {}) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const where = {
            user_id: userId,
        };
        if (filters.businessId !== undefined) {
            where.business_id = filters.businessId === null ? null : (0, ids_1.normalizeBusinessId)(filters.businessId);
        }
        if (filters.clientId !== undefined) {
            where.client_id = (0, ids_1.normalizeClientId)(filters.clientId);
        }
        if (filters.status === 'active') {
            where.status = { in: ['planned', 'in_progress', 'on_hold'] };
        }
        else if (filters.status) {
            validateStatus(filters.status);
            where.status = filters.status;
        }
        if (filters.search) {
            const search = filters.search.trim();
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const projects = await this.prismaClient.project.findMany({
            where,
            select: { ...projectSelect, client: { select: clientSelect } },
            orderBy: { created_at: 'desc' },
        });
        const results = [];
        for (const project of projects) {
            const financials = await this.computeProjectFinancials(project.id, userId);
            const progress = await this.computeProjectProgress(project.id, userId);
            results.push({
                project: project,
                client: project.client ?? undefined,
                financials,
                progress,
            });
        }
        return results;
    }
    async getProjectWithDetails(projectIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const projectId = (0, ids_1.normalizeProjectId)(projectIdInput);
        const project = await this.prismaClient.project.findFirst({
            where: { id: projectId, user_id: userId },
            select: {
                ...projectSelect,
                client: { select: clientSelect },
                services: { select: projectServiceSelect },
                milestones: { select: milestoneSelect, orderBy: [{ order_index: 'asc' }, { id: 'asc' }] },
                tasks: { select: taskSelect, orderBy: [{ sort_index: 'asc' }, { id: 'asc' }] },
            },
        });
        if (!project) {
            throw new errors_1.ProjectNotFoundError();
        }
        const financials = await this.computeProjectFinancials(projectId, userId);
        const progress = await this.computeProjectProgress(projectId, userId);
        return {
            project,
            client: project.client ?? undefined,
            services: project.services,
            milestones: project.milestones,
            tasks: project.tasks,
            financials,
            progress,
        };
    }
    async computeProjectFinancials(projectIdInput, userIdInput) {
        const projectId = (0, ids_1.normalizeProjectId)(projectIdInput);
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectId, userId);
        const sums = await this.prismaClient.transactions.groupBy({
            by: ['direction'],
            where: { user_id: userId, project_id: projectId },
            _sum: { amount: true },
            _count: { _all: true },
        });
        let revenue = new client_1.Prisma.Decimal(0);
        let costs = new client_1.Prisma.Decimal(0);
        let revenueCount = 0;
        let costsCount = 0;
        for (const row of sums) {
            const sumAmount = new client_1.Prisma.Decimal(row._sum.amount ?? 0);
            if (row.direction === 'in') {
                revenue = revenue.plus(sumAmount);
                revenueCount = row._count._all;
            }
            else if (row.direction === 'out') {
                costs = costs.plus(sumAmount);
                costsCount = row._count._all;
            }
        }
        return {
            revenue,
            costs,
            margin: revenue.minus(costs),
            revenueCount,
            costsCount,
        };
    }
    async computeProjectProgress(projectIdInput, userIdInput) {
        const project = await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectIdInput, userIdInput);
        // Completed project short-circuit
        if (project.status === 'completed') {
            return { mode: 'manual', value: 100, details: { status: project.status } };
        }
        const mode = project.progress_auto_mode === 'tasks' ||
            project.progress_auto_mode === 'milestones' ||
            project.progress_auto_mode === 'financial'
            ? project.progress_auto_mode
            : 'manual';
        if (mode === 'tasks') {
            const [total, done] = await Promise.all([
                this.prismaClient.projectTask.count({ where: { project_id: project.id } }),
                this.prismaClient.projectTask.count({ where: { project_id: project.id, status: 'done' } }),
            ]);
            const value = total === 0 ? 0 : clampProgress((done / total) * 100);
            return { mode, value, details: { total, done } };
        }
        if (mode === 'milestones') {
            const milestones = await this.prismaClient.projectMilestone.findMany({
                where: { project_id: project.id },
                select: { status: true, weight_pct: true },
            });
            if (milestones.length === 0) {
                return { mode, value: 0, details: { total: 0, completed: 0 } };
            }
            const hasWeights = milestones.some((m) => m.weight_pct != null);
            if (hasWeights) {
                const weightTotal = milestones.reduce((sum, m) => sum + (m.weight_pct ?? 0), 0);
                const completedWeight = milestones
                    .filter((m) => m.status === 'completed')
                    .reduce((sum, m) => sum + (m.weight_pct ?? 0), 0);
                const value = weightTotal === 0 ? 0 : clampProgress((completedWeight / weightTotal) * 100);
                return { mode, value, details: { weightTotal, completedWeight } };
            }
            const total = milestones.length;
            const completed = milestones.filter((m) => m.status === 'completed').length;
            const value = clampProgress((completed / total) * 100);
            return { mode, value, details: { total, completed } };
        }
        if (mode === 'financial') {
            const financials = await this.computeProjectFinancials(project.id, project.user_id);
            const budget = project.budget_amount ?? new client_1.Prisma.Decimal(0);
            const value = budget.gt(0) && financials.revenue
                ? clampProgress(financials.revenue.div(budget).mul(100).toNumber())
                : 0;
            return { mode, value, details: { budget, revenue: financials.revenue } };
        }
        const manualValue = project.progress_manual_pct ?? 0;
        return { mode: 'manual', value: clampProgress(manualValue), details: {} };
    }
    async deleteProject(projectIdInput, userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const project = await (0, assertions_1.assertProjectOwnedByUser)(this.prismaClient, projectIdInput, userId);
        await this.prismaClient.project.delete({ where: { id: project.id } });
    }
}
exports.ProjectsService = ProjectsService;
exports.projectsService = new ProjectsService(prisma_1.prisma);
