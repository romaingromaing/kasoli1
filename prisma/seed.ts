import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create platform
  const platform = await prisma.platform.upsert({
    where: { id: 1 },
    update: {},
    create: {
      walletAddress: '0xB16446ACdC14e653311BBf2924ee354E6de6fe68',
      name: 'Kasoli Platform',
      url: 'https://kasoli.com',
      email: 'platform@kasoli.com',
    },
  });

  // Create User record for platform
  const platformUser = await prisma.user.upsert({
    where: { walletAddress: '0xB16446ACdC14e653311BBf2924ee354E6de6fe68' },
    update: {},
    create: {
      walletAddress: '0xB16446ACdC14e653311BBf2924ee354E6de6fe68',
      currentRole: 'PLATFORM',
      email: 'platform@kasoli.com',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Platform created:', platform);
  console.log('Platform user created:', platformUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });