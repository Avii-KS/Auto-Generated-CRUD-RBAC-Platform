import { db } from '@/db';
import { modelDefinitions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query users table to get admin user ID
    const adminUser = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);
    
    if (!adminUser || adminUser.length === 0) {
        throw new Error('Admin user not found. Please run users seeder first.');
    }

    const adminUserId = adminUser[0].id;

    const sampleModelDefinition = {
        name: 'Product',
        tableName: 'products',
        fields: JSON.stringify([
            { name: 'name', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'description', type: 'string', required: false },
            { name: 'isActive', type: 'boolean', default: true },
            { name: 'ownerId', type: 'number', required: false }
        ]),
        ownerField: 'ownerId',
        rbac: JSON.stringify({
            Admin: ['create', 'read', 'update', 'delete'],
            Manager: ['create', 'read', 'update'],
            Viewer: ['read']
        }),
        createdBy: adminUserId,
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-15').toISOString(),
    };

    await db.insert(modelDefinitions).values(sampleModelDefinition);
    
    console.log('✅ Model definitions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});