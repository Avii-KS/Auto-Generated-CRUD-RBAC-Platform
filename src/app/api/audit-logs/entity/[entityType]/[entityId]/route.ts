import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const ALLOWED_ENTITY_TYPES = ['model_definition', 'data_record', 'user'];

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { entityType, entityId } = params;
    const { searchParams } = new URL(request.url);

    // Validate entityType
    if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json(
        {
          error: `Invalid entity type. Must be one of: ${ALLOWED_ENTITY_TYPES.join(', ')}`,
          code: 'INVALID_ENTITY_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate entityId
    if (!entityId) {
      return NextResponse.json(
        {
          error: 'Entity ID is required',
          code: 'MISSING_ENTITY_ID',
        },
        { status: 400 }
      );
    }

    // Pagination parameters
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Fetch audit logs with user information
    const logs = await db
      .select({
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
          email: users.email,
        },
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Check if logs exist for this entity
    if (logs.length === 0) {
      return NextResponse.json(
        {
          error: 'No audit logs found for this entity',
          code: 'NO_LOGS_FOUND',
        },
        { status: 404 }
      );
    }

    // Parse changes field from JSON string to object
    const parsedLogs = logs.map((log) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }));

    return NextResponse.json({
      entityType,
      entityId,
      logs: parsedLogs,
    });
  } catch (error) {
    console.error('GET audit logs error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}