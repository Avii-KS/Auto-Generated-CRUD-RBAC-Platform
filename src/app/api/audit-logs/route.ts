import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 });
    }

    // Check if user has Admin role
    if (user.role !== 'Admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Filters
    const userIdFilter = searchParams.get('userId');
    const actionFilter = searchParams.get('action');
    const entityTypeFilter = searchParams.get('entityType');
    const entityIdFilter = searchParams.get('entityId');
    const search = searchParams.get('search');

    // Build where conditions
    const conditions = [];
    
    if (userIdFilter) {
      conditions.push(eq(auditLogs.userId, parseInt(userIdFilter)));
    }
    
    if (actionFilter) {
      conditions.push(eq(auditLogs.action, actionFilter));
    }
    
    if (entityTypeFilter) {
      conditions.push(eq(auditLogs.entityType, entityTypeFilter));
    }
    
    if (entityIdFilter) {
      conditions.push(eq(auditLogs.entityId, entityIdFilter));
    }
    
    if (search) {
      conditions.push(like(auditLogs.entityName, `%${search}%`));
    }

    // Query audit logs with joined user information
    let query = db.select({
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
      }
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    // Parse changes field from JSON string to object
    const parsedResults = results.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }));

    return NextResponse.json(parsedResults, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, entityType, entityId, entityName, changes, ipAddress, userAgent } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        error: 'action is required',
        code: 'MISSING_ACTION'
      }, { status: 400 });
    }

    if (!entityType) {
      return NextResponse.json({ 
        error: 'entityType is required',
        code: 'MISSING_ENTITY_TYPE'
      }, { status: 400 });
    }

    if (!entityId) {
      return NextResponse.json({ 
        error: 'entityId is required',
        code: 'MISSING_ENTITY_ID'
      }, { status: 400 });
    }

    if (!entityName) {
      return NextResponse.json({ 
        error: 'entityName is required',
        code: 'MISSING_ENTITY_NAME'
      }, { status: 400 });
    }

    if (changes === undefined || changes === null) {
      return NextResponse.json({ 
        error: 'changes is required',
        code: 'MISSING_CHANGES'
      }, { status: 400 });
    }

    // Validate action value
    const validActions = ['CREATE', 'UPDATE', 'DELETE', 'READ'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: 'action must be one of: CREATE, UPDATE, DELETE, READ',
        code: 'INVALID_ACTION'
      }, { status: 400 });
    }

    // Validate entityType value
    const validEntityTypes = ['model_definition', 'data_record', 'user'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json({ 
        error: 'entityType must be one of: model_definition, data_record, user',
        code: 'INVALID_ENTITY_TYPE'
      }, { status: 400 });
    }

    // Validate userId exists in users table
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate changes is valid JSON
    let changesString: string;
    try {
      if (typeof changes === 'string') {
        // Validate it's valid JSON
        JSON.parse(changes);
        changesString = changes;
      } else if (typeof changes === 'object') {
        changesString = JSON.stringify(changes);
      } else {
        throw new Error('Invalid changes format');
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'changes must be valid JSON',
        code: 'INVALID_CHANGES_JSON'
      }, { status: 400 });
    }

    // Create audit log
    const newAuditLog = await db.insert(auditLogs)
      .values({
        userId: parseInt(userId),
        action,
        entityType,
        entityId: entityId.toString(),
        entityName,
        changes: changesString,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Parse changes field for response
    const responseLog = {
      ...newAuditLog[0],
      changes: JSON.parse(newAuditLog[0].changes)
    };

    return NextResponse.json(responseLog, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}