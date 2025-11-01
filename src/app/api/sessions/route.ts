import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single session by ID with user information
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const result = await db
        .select({
          id: sessions.id,
          userId: sessions.userId,
          token: sessions.token,
          expiresAt: sessions.expiresAt,
          createdAt: sessions.createdAt,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
          },
        })
        .from(sessions)
        .leftJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // List all sessions with pagination and optional userId filter
    let query = db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        token: sessions.token,
        expiresAt: sessions.expiresAt,
        createdAt: sessions.createdAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        },
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id));

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(sessions.userId, parseInt(userId)));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, expiresAt } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'token is required', code: 'MISSING_TOKEN' },
        { status: 400 }
      );
    }

    if (!expiresAt) {
      return NextResponse.json(
        { error: 'expiresAt is required', code: 'MISSING_EXPIRES_AT' },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate expiresAt is a valid timestamp
    const expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        { error: 'Valid expiresAt timestamp is required', code: 'INVALID_EXPIRES_AT' },
        { status: 400 }
      );
    }

    // Validate userId exists in users table
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate token uniqueness
    const tokenExists = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.token, token.trim()))
      .limit(1);

    if (tokenExists.length > 0) {
      return NextResponse.json(
        { error: 'Token already exists', code: 'DUPLICATE_TOKEN' },
        { status: 400 }
      );
    }

    // Create new session
    const newSession = await db
      .insert(sessions)
      .values({
        userId: parseInt(userId),
        token: token.trim(),
        expiresAt: expiresAtDate.toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newSession[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if session exists
    const sessionExists = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.id, parseInt(id)))
      .limit(1);

    if (sessionExists.length === 0) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete session
    const deleted = await db
      .delete(sessions)
      .where(eq(sessions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Session deleted successfully',
        session: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}