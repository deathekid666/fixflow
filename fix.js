const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.shop.findMany({
  select: { id: true, name: true, onboardingComplete: true }
}).then(r => console.log(JSON.stringify(r, null, 2)))
  .finally(() => p.$disconnect());