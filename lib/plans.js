const PLANS = {
  FREE: {
    label: "Free",
    dailyMessageLimit: 30,
    maxSources: 3,
    priceMonthly: 0,
  },
  PRO: {
    label: "Pro",
    dailyMessageLimit: 1000,
    maxSources: 100,
    priceMonthly: 49,
  },
};

function planFor(planKey) {
  return PLANS[planKey] || PLANS.FREE;
}

module.exports = { PLANS, planFor };
