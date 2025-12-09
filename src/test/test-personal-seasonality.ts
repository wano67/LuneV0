import { userService } from '@/modules/user/user.service';
import { accountService } from '@/modules/account/account.service';
import { transactionService } from '@/modules/transaction/transaction.service';
import { personalInsightsSeasonalityService } from '@/modules/personal/personal-insights-seasonality.service';

async function main() {
  console.log('🔹 Personal seasonality currency propagation test starting...');

  const ts = Date.now();
  const email = `seasonality.user+${ts}@example.com`;

  const { user } = await userService.createUserWithDefaultSettings({
    email,
    passwordHash: 'dummy',
    displayName: 'Seasonality User',
  });

  const userId = user.id;

  const personalAccount = await accountService.createPersonalAccount({
    userId,
    name: 'USD Account',
    type: 'current',
    currency: 'USD',
  });

  await transactionService.createPersonalTransaction({
    userId,
    accountId: personalAccount.id,
    date: new Date(),
    amount: 500,
    direction: 'in',
    label: 'Salary',
    type: 'income',
  });

  const seasonality = await personalInsightsSeasonalityService.getSeasonality({ userId, months: 3 });

  if (seasonality.currency !== 'USD') {
    throw new Error(`Expected currency to be USD, got ${seasonality.currency}`);
  }

  console.log('✅ Seasonality currency propagated correctly:', seasonality.currency);
  console.log('🔹 Personal seasonality currency propagation test completed successfully.');
}

main().catch((err) => {
  console.error('❌ Personal seasonality currency propagation test failed:', err);
  process.exit(1);
});
