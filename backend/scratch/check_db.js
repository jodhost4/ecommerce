const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const store = await prisma.store.findFirst({
      where: { slug: 'dd-cake' },
      include: { theme: true }
    });
    console.log('Store:', store ? store.name : 'Not Found');
    
    if (store && store.theme) {
       console.log('Theme Homepage Type:', typeof store.theme.homepage);
       console.log('Theme Homepage Value:', JSON.stringify(store.theme.homepage).substring(0, 50));
    }

    const addresses = await prisma.address.findMany({
      take: 5
    });
    console.log('Addresses count:', addresses.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
