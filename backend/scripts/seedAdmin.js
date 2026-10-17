import prisma from '../src/config/prisma.js';

async function main() {
  const email = 'bishal@admin.com';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', existing.id);
    return;
  }

  const user = await prisma.user.create({
    data: {
      full_name: 'bishal admin',
      email,
      college_email: null,
      password_hash: '$2a$10$NK0qDkwLbpUa.ibFMyxhfeHqMFRMa3CtXF0o77rfoV4870bmB8xba',
      role: 'super_admin',
      is_verified: true,
      is_active: true
    }
  });

  console.log('Created user id:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
