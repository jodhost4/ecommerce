const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function remove() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'divya', mode: 'insensitive' } },
        { firstName: { contains: 'divya', mode: 'insensitive' } }
      ]
    }
  });

  for (const user of users) {
    try {
      await prisma.user.delete({ where: { id: user.id } });
      console.log('Deleted user:', user.email);
    } catch (err) {
      console.error('Failed to delete user:', user.email, err.message);
    }
  }

  await prisma.$disconnect();
}

remove();
