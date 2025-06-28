import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create platform
  const platform = await prisma.platform.upsert({
    where: { id: 1 },
    update: {},
    create: {
      walletAddress: '0x383d00b8E88c89612FeCFCE522d6022460B5e7A6',
      name: 'Kasoli Platform',
      url: 'https://kasoli.com',
      email: 'platform@kasoli.com',
    },
  });

  // Create User record for platform
  const platformUser = await prisma.user.upsert({
    where: { walletAddress: '0x383d00b8E88c89612FeCFCE522d6022460B5e7A6' },
    update: {},
    create: {
      walletAddress: '0x383d00b8E88c89612FeCFCE522d6022460B5e7A6',
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