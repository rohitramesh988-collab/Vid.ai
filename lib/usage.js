const { prisma } = require("./db");
const { planFor } = require("./plans");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function checkAndIncrementUsage(userId, plan) {
  const day = todayKey();
  const limit = planFor(plan).dailyMessageLimit;

  const usage = await prisma.usage.upsert({
    where: { userId_day: { userId, day } },
    update: {},
    create: { userId, day, messageCount: 0 },
  });

  if (usage.messageCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  const updated = await prisma.usage.update({
    where: { userId_day: { userId, day } },
    data: { messageCount: { increment: 1 } },
  });

  return { allowed: true, remaining: limit - updated.messageCount, limit };
}

module.exports = { checkAndIncrementUsage, todayKey };
