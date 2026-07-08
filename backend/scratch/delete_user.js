const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function remove() {
  const email = 'divyadharshini1109@gmail.com';
  
  // Find user first
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    // Delete user (Prisma cascade will handle related data if configured, 
    // or we might need to delete manually if dependencies exist)
    await prisma.user.delete({ where: { id: user.id } });
    console.log('User deleted successfully:', email);
  } else {
    console.log('User not found:', email);
  }

  // Also check for 'divya1109' as email or username if it exists
  const user2 = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'divya1109' },
        { firstName: 'divya1109' }
      ]
    }
  });

  if (user2) {
    await prisma.user.delete({ where: { id: user2.id } });
    console.log('Second user match deleted:', user2.email);
  }

  await prisma.$disconnect();
}

remove();
