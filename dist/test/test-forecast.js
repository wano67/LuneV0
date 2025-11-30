"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("@/modules/user/user.service");
const business_service_1 = require("@/modules/business/business.service");
const forecast_service_1 = require("@/modules/forecast/forecast.service");
async function main() {
    console.log('🔹 Forecast smoke test starting...');
    const ts = Date.now();
    const email = `forecast.user+${ts}@example.com`;
    const { user } = await user_service_1.userService.createUserWithDefaultSettings({
        email,
        passwordHash: 'dummy',
        displayName: 'Forecast User',
    });
    const personalForecast = await forecast_service_1.forecastService.computePersonalSavingsForecast({
        userId: user.id,
        horizonMonths: 6,
        contributionsPerMonth: 100,
    });
    console.log('✅ Personal forecast:', personalForecast.months.slice(0, 2));
    const business = await business_service_1.businessService.createBusinessWithDefaultSettings({
        userId: user.id,
        name: `Biz ${ts}`,
        legalForm: 'SASU',
        currency: 'EUR',
    });
    const businessForecast = await forecast_service_1.forecastService.computeBusinessForecast({
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
