"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedExpenseService = exports.SharedExpenseService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
class SharedExpenseService {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async createSharedExpense(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        if (!options.participants || options.participants.length === 0) {
            throw new Error('At least one participant is required');
        }
        const totalAmount = new client_1.Prisma.Decimal(options.totalAmount);
        const expense = await this.prismaClient.$transaction(async (tx) => {
            const createdExpense = await tx.shared_expenses.create({
                data: {
                    user_id: userId,
                    label: options.label.trim(),
                    total_amount: totalAmount,
                    currency: options.currency.trim(),
                    date: options.date,
                    notes: options.notes ?? null,
                },
            });
            await tx.shared_expense_participants.createMany({
                data: options.participants.map((p) => ({
                    shared_expense_id: createdExpense.id,
                    name: p.name.trim(),
                    email: p.email?.trim() ?? null,
                    share_amount: new client_1.Prisma.Decimal(p.shareAmount),
                    is_owner: p.isOwner ?? false,
                })),
            });
            return createdExpense;
        });
        return expense;
    }
    async listSharedExpensesWithBalances(userIdInput) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const expenses = await this.prismaClient.shared_expenses.findMany({
            where: { user_id: userId },
            include: { participants: true, settlements: true },
            orderBy: { date: 'desc' },
        });
        const balancesMap = new Map();
        for (const expense of expenses) {
            const perExpense = this.computeBalancesForExpense(expense);
            for (const [name, balance] of perExpense.entries()) {
                balancesMap.set(name, (balancesMap.get(name) ?? new client_1.Prisma.Decimal(0)).add(balance));
            }
        }
        const balances = Array.from(balancesMap.entries()).map(([name, balance]) => ({
            name,
            balance: Number(balance),
        }));
        return { expenses, balances };
    }
    async settleDebt(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(this.prismaClient, userId);
        const expense = await this.prismaClient.shared_expenses.findUnique({
            where: { id: options.sharedExpenseId },
            select: { id: true, user_id: true },
        });
        if (!expense || expense.user_id !== userId) {
            throw new Error('Shared expense not found or not owned by user');
        }
        const settlement = await this.prismaClient.shared_expense_settlements.create({
            data: {
                shared_expense_id: expense.id,
                from_name: options.fromName.trim(),
                to_name: options.toName.trim(),
                amount: new client_1.Prisma.Decimal(options.amount),
                date: options.date,
                notes: options.notes ?? null,
            },
        });
        return settlement;
    }
    computeBalancesForExpense(expense) {
        const balances = new Map();
        const total = new client_1.Prisma.Decimal(expense.total_amount);
        const ownerParticipant = expense.participants.find((p) => p.is_owner) ?? expense.participants[0] ?? null;
        const ownerName = ownerParticipant?.name ?? 'Owner';
        // Owner fronts the total amount
        balances.set(ownerName, total);
        // Each participant owes their share (including owner’s own share reduces what is owed to them)
        for (const participant of expense.participants) {
            const share = new client_1.Prisma.Decimal(participant.share_amount);
            const name = participant.name;
            if (participant.is_owner) {
                balances.set(ownerName, (balances.get(ownerName) ?? new client_1.Prisma.Decimal(0)).minus(share));
                continue;
            }
            balances.set(name, (balances.get(name) ?? new client_1.Prisma.Decimal(0)).minus(share));
        }
        // Apply settlements: money flows from from_name to to_name
        for (const settlement of expense.settlements) {
            const amount = new client_1.Prisma.Decimal(settlement.amount);
            balances.set(settlement.from_name, (balances.get(settlement.from_name) ?? new client_1.Prisma.Decimal(0)).plus(amount));
            balances.set(settlement.to_name, (balances.get(settlement.to_name) ?? new client_1.Prisma.Decimal(0)).minus(amount));
        }
        return balances;
    }
}
exports.SharedExpenseService = SharedExpenseService;
exports.sharedExpenseService = new SharedExpenseService(prisma_1.prisma);
