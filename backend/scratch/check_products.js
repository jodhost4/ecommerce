const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const store = await prisma.store.findFirst({
    where: { owner: { email: 'divyadharshini1109@gmail.com' } }
  });

  if (!store) {
    console.log('No store found');
    return;
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: { images: true }
  });

  console.log('Store ID:', store.id);
  console.log('Products found:', products.length);
  console.log(JSON.stringify(products, null, 2));

  await prisma.$disconnect();
}

check();
