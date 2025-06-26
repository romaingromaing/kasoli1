import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create platform
  const platform = await prisma.platform.upsert({
    where: { id: 1 },
    update: {},
    create: {
      walletAddress: '0x4567890123456789012345678901234567890123',
      name: 'Kasoli Platform',
      url: 'https://kasoli.com',
    },
  });

  // Create farmers
  const farmer1 = await prisma.farmer.upsert({
    where: { walletAddress: '0x1234567890123456789012345678901234567890' },
    update: {},
    create: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      name: 'John Mukasa',
      phone: '+256701234567',
    },
  });

  const farmer2 = await prisma.farmer.upsert({
    where: { walletAddress: '0x1111111111111111111111111111111111111111' },
    update: {},
    create: {
      walletAddress: '0x1111111111111111111111111111111111111111',
      name: 'Sarah Nakato',
      phone: '+256702345678',
    },
  });

  // Create buyers
  const buyer1 = await prisma.buyer.upsert({
    where: { walletAddress: '0x2345678901234567890123456789012345678901' },
    update: {},
    create: {
      walletAddress: '0x2345678901234567890123456789012345678901',
      organisation: 'Grain Corp Ltd',
      contactName: 'David Ssemakula',
      phone: '+256703456789',
    },
  });

  // Create transporters
  const transporter1 = await prisma.transporter.upsert({
    where: { walletAddress: '0x3456789012345678901234567890123456789012' },
    update: {},
    create: {
      walletAddress: '0x3456789012345678901234567890123456789012',
      name: 'Moses Kiwanuka',
      vehicleReg: 'UAM 123A',
      phone: '+256704567890',
    },
  });

  // Create batches
  const batch1 = await prisma.batch.create({
    data: {
      receiptTokenId: '1',
      metaCid: 'QmMockMetadata123',
      photoCid: 'QmMockPhoto456',
      origin: 'Kampala Warehouse',
      destination: 'Entebbe Processing',
      grade: 'Grade A',
      weightKg: 2500,
      farmerId: farmer1.id,
      transporterId: transporter1.id,
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      receiptTokenId: '2',
      metaCid: 'QmMockMetadata456',
      photoCid: 'QmMockPhoto789',
      origin: 'Jinja Silo',
      destination: 'Port Bell',
      grade: 'Grade B',
      weightKg: 1800,
      farmerId: farmer2.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });