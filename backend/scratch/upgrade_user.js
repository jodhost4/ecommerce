const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgrade() {
  const role = await prisma.role.findUnique({ where: { name: 'STORE_OWNER' } });
  if (!role) {
    console.error('STORE_OWNER role not found');
    return;
  }

  const user = await prisma.user.update({
    where: { email: 'divyadharshini1109@gmail.com' },
    data: { roleId: role.id }
  });
  console.log('Account upgraded successfully:', user.email);
  await prisma.$disconnect();
}

upgrade();
