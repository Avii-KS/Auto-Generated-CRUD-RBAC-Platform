import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);

    // Validate userId is a valid integer
    const userIdNum = parseInt(userId);
    if (!userId || isNaN(userIdNum)) {
      return NextResponse.json(
        { 
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate user exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Get pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Query audit logs with user information
    const logs = await db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      entityName: auditLogs.entityName,
      changes: auditLogs.changes,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.userId, userIdNum))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Return 404 if no logs found
    if (logs.length === 0) {
      return NextResponse.json(
        { 
          error: 'No audit logs found for this user',
          code: 'NO_LOGS_FOUND' 
        },
        { status: 404 }
      );
    }

    // Parse changes field from JSON string to object
    const parsedLogs = logs.map(log => ({
      ...log,
      changes: JSON.parse(log.changes)
    }));

    return NextResponse.json(parsedLogs, { status: 200 });

  } catch (error) {
    console.error('GET audit logs error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}