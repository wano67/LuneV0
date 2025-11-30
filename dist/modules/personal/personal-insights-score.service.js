"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalInsightsScoreService = exports.PersonalInsightsScoreService = void 0;
const prisma_1 = require("@/lib/prisma");
const ids_1 = require("@/modules/shared/ids");
const assertions_1 = require("@/modules/shared/assertions");
const personal_insights_seasonality_service_1 = require("./personal-insights-seasonality.service");
const personal_insights_spending_service_1 = require("./personal-insights-spending.service");
const personal_insights_income_service_1 = require("./personal-insights-income.service");
class PersonalInsightsScoreService {
    async getScore(options) {
        const userId = (0, ids_1.normalizeUserId)(options.userId);
        await (0, assertions_1.assertUserExists)(prisma_1.prisma, userId);
        const months = options.months && options.months > 0 ? options.months : 12;
        const seasonality = await personal_insights_seasonality_service_1.personalInsightsSeasonalityService.getSeasonality({ userId, months });
        const spending = await personal_insights_spending_service_1.personalInsightsSpendingService.spendingByCategory({ userId });
        const income = await personal_insights_income_service_1.personalInsightsIncomeService.incomeSources({ userId });
        const nets = seasonality.points.map((p) => p.net);
        const monthsInRed = nets.filter((n) => n < 0).length;
        const totalNet = nets.reduce((sum, n) => sum + n, 0);
        const totalIncome = seasonality.points.reduce((sum, p) => sum + p.income, 0);
        const savingsRate = totalIncome > 0 ? totalNet / totalIncome : 0;
        const volatility = seasonality.points.reduce((sum, p) => sum + Math.abs(p.zScore), 0) / (seasonality.points.length || 1);
        let rawScore = 100;
        rawScore -= Math.min(40, monthsInRed * 3);
        rawScore -= Math.min(30, volatility * 5);
        rawScore += Math.max(-30, Math.min(30, savingsRate * 100));
        rawScore = Math.max(0, Math.min(100, rawScore));
        const grade = rawScore >= 85 ? 'A' : rawScore >= 70 ? 'B' : rawScore >= 55 ? 'C' : rawScore >= 40 ? 'D' : 'E';
        const explanation = [];
        if (monthsInRed > 0)
            explanation.push(`${monthsInRed} mois en négatif`);
        if (savingsRate > 0.2)
            explanation.push('Bon taux d\'épargne');
        else if (savingsRate < 0)
            explanation.push('Epargne négative');
        explanation.push(`Volatilité (z-score moyen): ${volatility.toFixed(2)}`);
        return {
            score: rawScore,
            grade,
            explanation,
            inputs: {
                savingsRate,
                volatility,
                monthsInRed,
                periodMonths: months,
            },
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.PersonalInsightsScoreService = PersonalInsightsScoreService;
exports.personalInsightsScoreService = new PersonalInsightsScoreService();
