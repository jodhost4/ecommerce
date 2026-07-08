const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'owner@demo.com' },
    include: { ownedStore: true }
  });
  console.log(JSON.stringify(user, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  await prisma.$disconnect();
}

check();
