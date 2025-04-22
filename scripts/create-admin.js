/**
 * Admin User Creation Script
 *
 * This script creates an initial admin user for the Ship Simulator
 * if one does not already exist in the database.
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Creates an admin user if one doesn't exist
 */
async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    // Admin credentials - in production, these should be environment variables
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'ship_sim_admin';
    const email = process.env.ADMIN_EMAIL || 'admin@shipsim.com';

    // Hash password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Create admin user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isAdmin: true,
      },
    });

    console.log(`Admin user created: ${user.username}`);
  } catch (error) {
    console.error('Failed to create admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
