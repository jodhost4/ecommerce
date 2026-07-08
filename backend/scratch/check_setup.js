const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'divyadharshini1109@gmail.com' },
    include: { 
      ownedStore: {
        include: {
          categories: true,
          brands: true
        }
      }
    }
  });
  console.log(JSON.stringify(user, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  await prisma.$disconnect();
}

check();
