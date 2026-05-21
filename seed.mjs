import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);

  const shop = await prisma.shop.create({
    data: { name: 'FixFlow Shop' },
  });

  await prisma.user.create({
    data: {
      email: 'admin@fixflow.com',
      name: 'Admin',
      password: hash,
      role: 'ADMIN',
      shopId: shop.id,
    },
  });

  console.log('Done! Shop and admin created.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 
