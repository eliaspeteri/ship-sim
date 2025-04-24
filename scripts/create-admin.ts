/**
 * Admin User Creation Script
 *
 * This script creates an initial admin user for the Ship Simulator
 * using the role-based access control system.
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Creates an admin user if one doesn't exist
 */
async function createAdminUser(): Promise<void> {
  try {
    // First check if there's a user with admin role already
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' },
      include: {
        userRoles: true
      }
    });

    // If there's already a user with admin role, skip creation
    if (adminRole && adminRole.userRoles.length > 0) {
      console.info('Admin user already exists, skipping creation');
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

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Create the admin user
      const user = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
        },
      });
      
      console.info(`User created: ${user.username}`);
      
      // Find or create admin role
      let adminRole = await tx.role.findFirst({
        where: { name: 'admin' },
      });
      
      if (!adminRole) {
        // Create admin role if it doesn't exist
        adminRole = await tx.role.create({
          data: {
            name: 'admin',
            description: 'Full system administrator access',
          },
        });
        
        console.info(`Admin role created`);
        
        // Create basic admin permissions
        const adminPermissions = [
          { resource: 'user', action: 'manage' },
          { resource: 'role', action: 'manage' },
          { resource: 'vessel', action: 'manage' },
          { resource: 'environment', action: 'manage' },
          { resource: 'system', action: 'manage' },
          { resource: '*', action: '*' }, // Wildcard permission for full access
        ];
        
        // Create permissions and link to admin role
        for (const perm of adminPermissions) {
          const permission = await tx.permission.create({
            data: {
              name: `${perm.resource}:${perm.action}`,
              resource: perm.resource,
              action: perm.action,
              description: `Permission to ${perm.action} ${perm.resource}`,
            },
          });
          
          await tx.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });
        }
      }
      
      // Assign admin role to user
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
      
      console.info(`Admin role assigned to ${user.username}`);
    });

    console.info(`Admin user setup completed successfully`);
  } catch (error) {
    console.error('Failed to create admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
