import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const timestamp = new Date().toISOString();
    
    const sampleUsers = [
        {
            email: 'admin@example.com',
            password: await bcrypt.hash('admin123', 10),
            name: 'Admin User',
            role: 'Admin',
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            email: 'manager@example.com',
            password: await bcrypt.hash('manager123', 10),
            name: 'Manager User',
            role: 'Manager',
            createdAt: timestamp,
            updatedAt: timestamp,
        },
        {
            email: 'viewer@example.com',
            password: await bcrypt.hash('viewer123', 10),
            name: 'Viewer User',
            role: 'Viewer',
            createdAt: timestamp,
            updatedAt: timestamp,
        }
    ];

    const insertedUsers = await db.insert(users).values(sampleUsers).returning();
    
    console.log('✅ Users seeder completed successfully');
    console.log(`Created ${insertedUsers.length} users`);
    
    return insertedUsers;
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});