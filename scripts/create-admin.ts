import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const password = 'admin123';
    
    // Create or update society
    const society = await prisma.society.upsert({
      where: { id: 'default-society' },
      update: {},
      create: {
        id: 'default-society',
        name: 'Default Society',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
    
    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@society.com' },
      update: { password: password, societyId: society.id },
      create: {
        email: 'admin@society.com',
        password: password,
        name: 'Admin',
        role: 'admin',
        status: 'active',
        societyId: society.id,
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@society.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
