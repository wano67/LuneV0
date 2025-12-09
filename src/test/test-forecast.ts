import { userService } from '@/modules/user/user.service';
import { businessService } from '@/modules/business/business.service';
import { forecastService } from '@/modules/forecast/forecast.service';

function assertFinitePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${label}: expected non-negative finite number, got ${value}`);
  }
}

function assertString(value: unknown, label: string) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ${label}: expected non-empty string, got ${value}`);
  }
}

async function main() {
  console.log('🔹 Forecast smoke test starting...');

  const horizonMonths = 6;
  const ts = Date.now();
  const email = `forecast.user+${ts}@example.com`;

  const { user } = await userService.createUserWithDefaultSettings({
    email,
    passwordHash: 'dummy',
    displayName: 'Forecast User',
  });

  const personalForecast = await forecastService.computePersonalSavingsForecast({
    userId: user.id,
    horizonMonths,
    contributionsPerMonth: 100,
  });

  if (!personalForecast.months || personalForecast.months.length !== horizonMonths) {
    throw new Error(
      `Personal forecast returned ${personalForecast.months?.length ?? 0} months instead of ${horizonMonths}`
    );
  }

  personalForecast.months.forEach((month, idx) => {
    assertString(month.month, `personal month label at index ${idx}`);
    assertFinitePositive(month.projectedAmount, `personal projectedAmount at index ${idx}`);

    if (!Array.isArray(month.goalsProgress)) {
      throw new Error(`Personal goalsProgress missing at index ${idx}`);
    }

    month.goalsProgress.forEach((goalProgress, goalIdx) => {
      assertFinitePositive(goalProgress.targetAmount, `goal targetAmount at ${idx}:${goalIdx}`);
      assertFinitePositive(goalProgress.projectedAmount, `goal projectedAmount at ${idx}:${goalIdx}`);
      if (goalProgress.projectedCompletionDate !== undefined) {
        const time = goalProgress.projectedCompletionDate.getTime();
        if (Number.isNaN(time)) {
          throw new Error(`Invalid projectedCompletionDate at ${idx}:${goalIdx}`);
        }
      }
    });
  });

  console.log('✅ Personal forecast:', personalForecast.months.slice(0, 2));

  const business = await businessService.createBusinessWithDefaultSettings({
    userId: user.id,
    name: `Biz ${ts}`,
    legalForm: 'SASU',
    currency: 'EUR',
  });

  const businessForecast = await forecastService.computeBusinessForecast({
    userId: user.id,
    businessId: business.business.id,
    horizonMonths,
  });

  if (!businessForecast.months || businessForecast.months.length !== horizonMonths) {
    throw new Error(
      `Business forecast returned ${businessForecast.months?.length ?? 0} months instead of ${horizonMonths}`
    );
  }

  businessForecast.months.forEach((month, idx) => {
    assertString(month.month, `business month label at index ${idx}`);
    assertFinitePositive(month.forecastedRevenue, `business forecastedRevenue at index ${idx}`);
    assertFinitePositive(month.forecastedCosts, `business forecastedCosts at index ${idx}`);
    const expectedMargin = month.forecastedRevenue - month.forecastedCosts;
    if (!Number.isFinite(month.forecastedMargin) || Math.abs(month.forecastedMargin - expectedMargin) > 1e-6) {
      throw new Error(`Incoherent forecastedMargin at index ${idx}`);
    }
  });

  const { assumptions } = businessForecast;
  if (!assumptions) {
    throw new Error('Business forecast assumptions are missing');
  }

  assertFinitePositive(assumptions.recurringExpensesPerMonth, 'assumptions.recurringExpensesPerMonth');
  assertFinitePositive(assumptions.averageProjectMarginPct, 'assumptions.averageProjectMarginPct');
  assertFinitePositive(assumptions.pipelineWeightedRevenue, 'assumptions.pipelineWeightedRevenue');

  console.log('✅ Business forecast (first 2 months):', businessForecast.months.slice(0, 2));

  console.log('✅ Forecast smoke test completed successfully.');
}

main().catch((err) => {
  console.error('❌ Forecast smoke test failed:', err);
  process.exit(1);
});
