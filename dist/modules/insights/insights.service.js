"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightsService = exports.InsightsService = void 0;
// src/modules/insights/insights.service.ts
const prisma_1 = require("@/lib/prisma");
const budget_service_1 = require("@/modules/budget/budget.service");
const cashflow_service_1 = require("@/modules/cashflow/cashflow.service");
const savings_service_1 = require("@/modules/savings/savings.service");
const assertions_1 = require("@/modules/shared/assertions");
const ids_1 = require("@/modules/shared/ids");
const personal_budget_overspent_rule_1 = require("./rules/personal-budget-overspent.rule");
const personal_lifestyle_spend_increase_rule_1 = require("./rules/personal-lifestyle-spend-increase.rule");
const personal_subscription_review_rule_1 = require("./rules/personal-subscription-review.rule");
const business_late_invoices_rule_1 = require("./rules/business-late-invoices.rule");
const business_low_margin_project_rule_1 = require("./rules/business-low-margin-project.rule");
const business_under_target_revenue_rule_1 = require("./rules/business-under-target-revenue.rule");
class InsightsService {
    /**
     * Compute personal (non-business) insights for a user:
     * - budget overrun (current month)
     * - savings goals behind schedule
     * - cashflow risk (projection turning negative)
     */
    async computePersonalInsights(userIdInput, opts) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        await (0, assertions_1.assertUserExists)(prisma_1.prisma, userId);
        const today = new Date();
        const year = opts?.year ?? today.getUTCFullYear();
        const month = opts?.month ?? today.getUTCMonth() + 1;
        const results = await Promise.all([
            this.computeBudgetOverrun(userId, null),
            this.computeSavingsInsights(userId, null),
            this.computeCashflowInsight(userId, null),
            (0, personal_budget_overspent_rule_1.personalBudgetOverspentRule)({ userId, year, month }),
            (0, personal_lifestyle_spend_increase_rule_1.personalLifestyleSpendIncreaseRule)({ userId, year, month }),
            (0, personal_subscription_review_rule_1.personalSubscriptionReviewRule)({ userId }),
        ]);
        return results.flatMap((r) => (Array.isArray(r) ? r : r ? [r] : [])).filter(Boolean);
    }
    /**
     * Compute business-specific insights for a given business.
     * Pour l’instant, la logique budget/savings/cashflow business peut être limitée ou
     * alignée sur les règles perso si besoin.
     */
    async computeBusinessInsights(userIdInput, businessIdInput, opts) {
        const userId = (0, ids_1.normalizeUserId)(userIdInput);
        const businessId = (0, ids_1.normalizeBusinessId)(businessIdInput);
        await (0, assertions_1.assertUserExists)(prisma_1.prisma, userId);
        await (0, assertions_1.assertBusinessOwnedByUser)(prisma_1.prisma, businessId, userId);
        const today = new Date();
        const year = opts?.year ?? today.getUTCFullYear();
        const month = opts?.month ?? today.getUTCMonth() + 1;
        const results = await Promise.all([
            this.computeBudgetOverrun(userId, businessId),
            this.computeSavingsInsights(userId, businessId),
            this.computeCashflowInsight(userId, businessId),
            (0, business_late_invoices_rule_1.businessLateInvoicesRule)({ userId, businessId }),
            (0, business_low_margin_project_rule_1.businessLowMarginProjectRule)({ userId, businessId }),
            (0, business_under_target_revenue_rule_1.businessUnderTargetRevenueRule)({ userId, businessId, year, month }),
        ]);
        return results.flatMap((r) => (Array.isArray(r) ? r : r ? [r] : [])).filter(Boolean);
    }
    /**
     * Budget overrun rule (current month).
     * Pour l’instant, implémenté uniquement pour le scope personnel (businessId = null).
     */
    async computeBudgetOverrun(userId, businessId) {
        // Phase 1: on ne gère que le budget perso
        if (businessId !== null)
            return null;
        const overview = await budget_service_1.budgetService.computeCurrentPersonalBudgetOverview(userId, {});
        if (!overview)
            return null;
        if (overview.totalActual <= overview.totalPlanned * 1.1) {
            return null;
        }
        const severity = overview.totalActual > overview.totalPlanned * 1.25 ? 'critical' : 'warning';
        return {
            id: 'budget_overrun_current_month',
            userId,
            businessId,
            category: 'budget',
            severity,
            title: 'Budget overrun',
            message: 'Actual spending exceeded planned budget for the current month.',
            data: {
                totalPlanned: overview.totalPlanned,
                totalActual: overview.totalActual,
                variance: overview.totalVariance,
                budgetId: overview.budget.id,
            },
        };
    }
    /**
     * Savings rules:
     * - goal far behind schedule near target date
     * - goal behind pace with near target date
     * - theoretical vs actual progress lagging
     * - goal appears completed but not marked as such
     */
    async computeSavingsInsights(userId, businessId) {
        const insights = [];
        const filter = businessId === null
            ? { businessId: null }
            : { businessId };
        const goals = await savings_service_1.savingsService.listSavingsGoalsForUser(userId, filter);
        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const nearFuture = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        for (const goal of goals) {
            const target = Number(goal.target_amount);
            const current = Number(goal.current_amount_cached);
            const progress = target > 0 ? current / target : 0;
            const createdAt = goal.created_at ? new Date(goal.created_at) : null;
            const targetDate = goal.target_date ? new Date(goal.target_date) : null;
            const totalDuration = createdAt && targetDate ? Math.max(1, targetDate.getTime() - createdAt.getTime()) : null;
            const elapsed = createdAt ? now.getTime() - createdAt.getTime() : null;
            const expectedProgress = totalDuration && elapsed
                ? Math.min(1, Math.max(0, elapsed / totalDuration))
                : 0;
            // 1) Goal very close & almost no progress
            if (goal.target_date && progress < 0.1 && goal.target_date <= soon) {
                insights.push({
                    id: 'savings-behind-schedule',
                    userId,
                    businessId,
                    category: 'savings',
                    severity: 'warning',
                    title: 'Savings goal at risk',
                    message: `Goal "${goal.name}" is far behind schedule.`,
                    data: {
                        goalId: goal.id,
                        targetDate: goal.target_date,
                        progress,
                    },
                });
            }
            // 2) Target in near future & progress < 50%
            if (targetDate && targetDate <= nearFuture && progress < 0.5) {
                insights.push({
                    id: 'savings-behind-schedule-near',
                    userId,
                    businessId,
                    category: 'savings',
                    severity: 'warning',
                    title: 'Savings goal behind schedule',
                    message: `Goal "${goal.name}" is behind the expected pace.`,
                    data: {
                        goalId: goal.id,
                        targetDate: goal.target_date,
                        progress,
                    },
                });
            }
            // 3) Theoretical vs actual progress (lagging > 20 pts)
            if (expectedProgress > 0 && progress + 0.2 < expectedProgress) {
                insights.push({
                    id: 'savings-progress-lagging',
                    userId,
                    businessId,
                    category: 'savings',
                    severity: 'warning',
                    title: 'Savings progress is lagging',
                    message: `Goal "${goal.name}" is behind theoretical progress.`,
                    data: {
                        goalId: goal.id,
                        progress,
                        expectedProgress,
                    },
                });
            }
            // 4) Completed but not marked as completed
            if (progress >= 1.0 && goal.status !== 'completed') {
                insights.push({
                    id: 'savings-complete-pending',
                    userId,
                    businessId,
                    category: 'savings',
                    severity: 'info',
                    title: 'Savings goal reached',
                    message: `Goal "${goal.name}" appears completed. Consider marking it as completed.`,
                    data: {
                        goalId: goal.id,
                        progress,
                    },
                });
            }
        }
        return insights;
    }
    /**
     * Cashflow rule:
     * - find first projected date where balance < 0 over the next ~60 days.
     */
    async computeCashflowInsight(userId, businessId) {
        try {
            const projection = businessId === null
                ? await cashflow_service_1.cashflowService.computePersonalCashflowProjection(userId, { horizonDays: 60 })
                : await cashflow_service_1.cashflowService.computeBusinessCashflowProjection(userId, businessId, {
                    horizonDays: 60,
                });
            const firstNegative = projection.points.find((p) => p.balance < 0);
            if (!firstNegative)
                return null;
            return {
                id: 'cashflow_negative_projection',
                userId,
                businessId,
                category: 'cashflow',
                severity: 'critical',
                title: 'Cashflow risk detected',
                message: 'Projected cashflow turns negative in the coming weeks.',
                data: {
                    horizonDays: projection.horizonDays,
                    firstNegativeDate: firstNegative.date,
                    projectedBalance: firstNegative.balance,
                },
            };
        }
        catch {
            // En cas d’erreur (pas assez de données, etc.) on ne bloque pas les autres insights.
            return null;
        }
    }
}
exports.InsightsService = InsightsService;
exports.insightsService = new InsightsService();
