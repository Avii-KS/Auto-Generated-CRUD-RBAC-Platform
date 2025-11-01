import { db } from '@/db';
import { auditLogs } from '@/db/schema';

async function main() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const getRandomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    };

    const sampleAuditLogs = [
        // CREATE actions (4 records)
        {
            userId: 1,
            action: 'CREATE',
            entityType: 'model_definition',
            entityId: '1',
            entityName: 'Product Model',
            changes: JSON.stringify({
                before: null,
                after: {
                    name: 'Product Model',
                    tableName: 'products',
                    fields: [
                        { name: 'name', type: 'text' },
                        { name: 'price', type: 'number' }
                    ]
                }
            }),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 2,
            action: 'CREATE',
            entityType: 'data_record',
            entityId: '5',
            entityName: 'Product Record #5',
            changes: JSON.stringify({
                before: null,
                after: {
                    name: 'iPhone 15 Pro',
                    price: 999.99,
                    category: 'electronics'
                }
            }),
            ipAddress: '10.0.0.15',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 1,
            action: 'CREATE',
            entityType: 'user',
            entityId: '4',
            entityName: 'New Manager User',
            changes: JSON.stringify({
                before: null,
                after: {
                    email: 'manager@company.com',
                    name: 'Sarah Johnson',
                    role: 'Manager'
                }
            }),
            ipAddress: '192.168.1.105',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 2,
            action: 'CREATE',
            entityType: 'model_definition',
            entityId: '3',
            entityName: 'Order Model',
            changes: JSON.stringify({
                before: null,
                after: {
                    name: 'Order Model',
                    tableName: 'orders',
                    fields: [
                        { name: 'orderNumber', type: 'text' },
                        { name: 'totalAmount', type: 'number' },
                        { name: 'status', type: 'text' }
                    ]
                }
            }),
            ipAddress: '10.0.0.20',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },

        // UPDATE actions (4 records)
        {
            userId: 2,
            action: 'UPDATE',
            entityType: 'data_record',
            entityId: '3',
            entityName: 'Customer Record #3',
            changes: JSON.stringify({
                before: {
                    status: 'pending',
                    email: 'john.doe@email.com'
                },
                after: {
                    status: 'active',
                    email: 'john.doe@newemail.com'
                }
            }),
            ipAddress: '10.0.0.15',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 1,
            action: 'UPDATE',
            entityType: 'model_definition',
            entityId: '2',
            entityName: 'Customer Model',
            changes: JSON.stringify({
                before: {
                    fields: [
                        { name: 'name', type: 'text' },
                        { name: 'email', type: 'text' }
                    ]
                },
                after: {
                    fields: [
                        { name: 'name', type: 'text' },
                        { name: 'email', type: 'text' },
                        { name: 'phone', type: 'text' }
                    ]
                }
            }),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 3,
            action: 'UPDATE',
            entityType: 'user',
            entityId: '2',
            entityName: 'Manager User Profile',
            changes: JSON.stringify({
                before: {
                    name: 'Mike Wilson',
                    role: 'Viewer'
                },
                after: {
                    name: 'Mike Wilson',
                    role: 'Manager'
                }
            }),
            ipAddress: '172.16.0.50',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 2,
            action: 'UPDATE',
            entityType: 'data_record',
            entityId: '8',
            entityName: 'Invoice Record #8',
            changes: JSON.stringify({
                before: {
                    amount: 1500.00,
                    status: 'draft',
                    dueDate: '2024-02-15'
                },
                after: {
                    amount: 1650.00,
                    status: 'sent',
                    dueDate: '2024-02-20'
                }
            }),
            ipAddress: '10.0.0.25',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },

        // DELETE actions (3 records)
        {
            userId: 1,
            action: 'DELETE',
            entityType: 'data_record',
            entityId: '7',
            entityName: 'Old Product Record #7',
            changes: JSON.stringify({
                before: {
                    name: 'Discontinued Widget',
                    price: 49.99,
                    inStock: false
                },
                after: null
            }),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 1,
            action: 'DELETE',
            entityType: 'user',
            entityId: '5',
            entityName: 'Inactive User Account',
            changes: JSON.stringify({
                before: {
                    email: 'inactive@company.com',
                    name: 'Inactive User',
                    role: 'Viewer'
                },
                after: null
            }),
            ipAddress: '192.168.1.105',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 2,
            action: 'DELETE',
            entityType: 'model_definition',
            entityId: '4',
            entityName: 'Legacy Report Model',
            changes: JSON.stringify({
                before: {
                    name: 'Legacy Report Model',
                    tableName: 'old_reports',
                    fields: [
                        { name: 'title', type: 'text' },
                        { name: 'data', type: 'text' }
                    ]
                },
                after: null
            }),
            ipAddress: '10.0.0.30',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },

        // READ actions (4 records)
        {
            userId: 3,
            action: 'READ',
            entityType: 'data_record',
            entityId: '2',
            entityName: 'Customer Data #2',
            changes: JSON.stringify({
                fields: ['name', 'email', 'phone', 'address']
            }),
            ipAddress: '172.16.0.50',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 3,
            action: 'READ',
            entityType: 'model_definition',
            entityId: '1',
            entityName: 'Product Model Schema',
            changes: JSON.stringify({
                fields: ['name', 'tableName', 'fields', 'rbac']
            }),
            ipAddress: '172.16.0.55',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 2,
            action: 'READ',
            entityType: 'user',
            entityId: '1',
            entityName: 'Admin User Profile',
            changes: JSON.stringify({
                fields: ['email', 'name', 'role', 'createdAt']
            }),
            ipAddress: '10.0.0.15',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
        {
            userId: 3,
            action: 'READ',
            entityType: 'data_record',
            entityId: '10',
            entityName: 'Order Details #10',
            changes: JSON.stringify({
                fields: ['orderNumber', 'totalAmount', 'status', 'items']
            }),
            ipAddress: '172.16.0.60',
            userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
            createdAt: getRandomDate(thirtyDaysAgo, now),
        },
    ];

    await db.insert(auditLogs).values(sampleAuditLogs);
    
    console.log('✅ Audit logs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});