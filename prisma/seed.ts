import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kewen-api.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@kewen-api.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Admin user created:', {
    username: adminUser.username,
    email: adminUser.email,
  });

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@kewen-api.com' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@kewen-api.com',
      password: demoPassword,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Demo user created:', {
    username: demoUser.username,
    email: demoUser.email,
  });

  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('Admin - Username: admin, Password: admin123');
  console.log('Demo  - Username: demo, Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
