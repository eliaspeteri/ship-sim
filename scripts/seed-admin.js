// Seed a default admin user into the database via Prisma.
// Run with: node scripts/seed-admin.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin';
  const role = 'admin';

  const existing = await prisma.user.findFirst({
    where: { name: username },
  });
  if (existing) {
    console.log(`User "${username}" already exists with role ${existing.role}`);
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await prisma.user.create({
    data: {
      name: username,
      role,
      passwordHash,
    },
  });

  console.log(
    `Seeded admin user "${user.name}" (${user.id}) with default password.`,
  );
}

main()
  .catch(err => {
    console.error('Seed failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
