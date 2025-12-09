import { userService } from '@/modules/user/user.service';
import { businessService } from '@/modules/business/business.service';
import { forecastService } from '@/modules/forecast/forecast.service';

async function main() {
  console.log('🔹 Forecast smoke test starting...');

  const ts = Date.now();
  const email = `forecast.user+${ts}@example.com`;

  const { user } = await userService.createUserWithDefaultSettings({
    email,
    passwordHash: 'dummy',
    displayName: 'Forecast User',
  });

  const personalForecast = await forecastService.computePersonalSavingsForecast({
    userId: user.id,
    horizonMonths: 6,
    contributionsPerMonth: 100,
  });

  personalForecast.months.forEach((month, idx) => {
    if (idx === 0) return;
    const previous = personalForecast.months[idx - 1];
    if (month.projectedAmount <= previous.projectedAmount) {
      throw new Error(
        `Projected amount did not increase between ${previous.month} (${previous.projectedAmount}) and ${month.month} (${month.projectedAmount})`
      );
    }
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
    horizonMonths: 6,
  });

  console.log('✅ Business forecast (first 2 months):', businessForecast.months.slice(0, 2));

  console.log('✅ Forecast smoke test completed successfully.');
}

main().catch((err) => {
  console.error('❌ Forecast smoke test failed:', err);
  process.exit(1);
});
