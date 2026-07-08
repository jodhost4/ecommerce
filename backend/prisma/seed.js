const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Full system access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'STORE_OWNER' },
      update: {},
      create: { name: 'STORE_OWNER', description: 'Store owner with full store access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'STORE_STAFF' },
      update: {},
      create: { name: 'STORE_STAFF', description: 'Store staff with limited access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'Regular customer', isSystem: true },
    }),
  ]);
  console.log('Roles created:', roles.length);

  // Create Super Admin
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@commerce.com' },
    update: {},
    create: {
      email: 'admin@commerce.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: roles.find((r) => r.name === 'SUPER_ADMIN').id,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Super admin created:', admin.email);

  // Create Permissions for each role
  const permissions = [
    { role: 'SUPER_ADMIN', resources: ['*'], actions: ['*'] },
    { role: 'STORE_OWNER', resources: ['store', 'products', 'orders', 'customers', 'coupons', 'reports'], actions: ['create', 'read', 'update', 'delete'] },
    { role: 'STORE_STAFF', resources: ['products', 'orders', 'customers'], actions: ['read', 'update'] },
    { role: 'CUSTOMER', resources: ['profile', 'orders'], actions: ['read', 'update'] },
  ];

  for (const perm of permissions) {
    const role = roles.find((r) => r.name === perm.role);
    for (const resource of perm.resources) {
      for (const action of perm.actions) {
        await prisma.permission.upsert({
          where: { roleId_resource_action: { roleId: role.id, resource, action } },
          update: {},
          create: { roleId: role.id, resource, action },
        });
      }
    }
  }
  console.log('Permissions created');

  // Create demo store owner
  const ownerPassword = await bcrypt.hash('Owner@123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      password: ownerPassword,
      firstName: 'Demo',
      lastName: 'Store Owner',
      roleId: roles.find((r) => r.name === 'STORE_OWNER').id,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Demo store owner created:', owner.email);

  // Create demo store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      description: 'A demo store for testing',
      email: 'store@demo.com',
      phone: '+1234567890',
      businessCategory: 'Electronics',
      isActive: true,
      isVerified: true,
      ownerId: owner.id,
    },
  });
  console.log('Demo store created:', store.name);

  // Create store settings
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      currency: 'USD',
      language: 'en',
      timezone: 'UTC',
      taxRate: 10,
      lowStockThreshold: 10,
    },
  });
  console.log('Store settings created');

  // Create default theme
  await prisma.storeTheme.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      name: 'Default',
      colors: { primary: '#3b82f6', secondary: '#64748b', background: '#ffffff', text: '#1e293b' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: { width: 'full', sidebar: 'left' },
    },
  });
  console.log('Store theme created');

  // Create demo customer
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      password: customerPassword,
      firstName: 'Demo',
      lastName: 'Customer',
      roleId: roles.find((r) => r.name === 'CUSTOMER').id,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Demo customer created:', customer.email);

  // Create categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items' },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: cat.slug } },
      update: {},
      create: { ...cat, storeId: store.id, isActive: true },
    });
  }
  console.log('Categories created:', categories.length);

  // Create brands
  const brands = [
    { name: 'Apple', slug: 'apple' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'Nike', slug: 'nike' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { storeId_slug: { storeId: store.id, slug: brand.slug } },
      update: {},
      create: { ...brand, storeId: store.id, isActive: true },
    });
  }
  console.log('Brands created:', brands.length);

  // Create sample products
  const dbCategories = await prisma.category.findMany({ where: { storeId: store.id } });
  const dbBrands = await prisma.brand.findMany({ where: { storeId: store.id } });

  const products = [
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      basePrice: 999.99,
      comparePrice: 1099.99,
      description: 'Latest Apple iPhone with A17 Pro chip',
      categorySlug: 'electronics',
      brandSlug: 'apple',
    },
    {
      name: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      basePrice: 899.99,
      description: 'Premium Android smartphone with AI features',
      categorySlug: 'electronics',
      brandSlug: 'samsung',
    },
    {
      name: 'Nike Air Max',
      slug: 'nike-air-max',
      basePrice: 149.99,
      comparePrice: 179.99,
      description: 'Comfortable running shoes with Air cushioning',
      categorySlug: 'clothing',
      brandSlug: 'nike',
    },
  ];

  for (const product of products) {
    const category = dbCategories.find((c) => c.slug === product.categorySlug);
    const brand = dbBrands.find((b) => b.slug === product.brandSlug);
    await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: product.slug } },
      update: {},
      create: {
        storeId: store.id,
        categoryId: category?.id,
        brandId: brand?.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice,
        comparePrice: product.comparePrice,
        isActive: true,
        isPhysical: true,
        trackQuantity: true,
      },
    });
  }
  console.log('Products created:', products.length);

  // Create shipping zones
  const existingZone = await prisma.shippingZone.findFirst({
    where: { storeId: store.id, name: 'Domestic' },
  });
  if (!existingZone) {
    await prisma.shippingZone.create({
      data: {
        storeId: store.id,
        name: 'Domestic',
        countries: ['US'],
        regions: [],
        isActive: true,
      },
    });
  }
  console.log('Shipping zone created');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
