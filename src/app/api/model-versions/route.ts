import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { modelVersions, modelDefinitions, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelDefinitionId, definition, changeDescription, createdBy } = body;

    // Validate required fields
    if (modelDefinitionId === undefined || modelDefinitionId === null) {
      return NextResponse.json(
        { error: 'Model definition ID is required', code: 'MISSING_MODEL_DEFINITION_ID' },
        { status: 400 }
      );
    }

    if (!definition) {
      return NextResponse.json(
        { error: 'Definition is required', code: 'MISSING_DEFINITION' },
        { status: 400 }
      );
    }

    if (!changeDescription) {
      return NextResponse.json(
        { error: 'Change description is required', code: 'MISSING_CHANGE_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (createdBy === undefined || createdBy === null) {
      return NextResponse.json(
        { error: 'Created by is required', code: 'MISSING_CREATED_BY' },
        { status: 400 }
      );
    }

    // Validate modelDefinitionId is a valid integer
    const parsedModelDefinitionId = parseInt(modelDefinitionId);
    if (isNaN(parsedModelDefinitionId)) {
      return NextResponse.json(
        { error: 'Model definition ID must be a valid integer', code: 'INVALID_MODEL_DEFINITION_ID' },
        { status: 400 }
      );
    }

    // Validate createdBy is a valid integer
    const parsedCreatedBy = parseInt(createdBy);
    if (isNaN(parsedCreatedBy)) {
      return NextResponse.json(
        { error: 'Created by must be a valid integer', code: 'INVALID_CREATED_BY' },
        { status: 400 }
      );
    }

    // Validate modelDefinitionId exists
    const modelDefinition = await db
      .select()
      .from(modelDefinitions)
      .where(eq(modelDefinitions.id, parsedModelDefinitionId))
      .limit(1);

    if (modelDefinition.length === 0) {
      return NextResponse.json(
        { error: 'Model definition not found', code: 'MODEL_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate createdBy exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedCreatedBy))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Convert definition to JSON string and validate
    let definitionString: string;
    try {
      if (typeof definition === 'string') {
        // Validate it's valid JSON
        JSON.parse(definition);
        definitionString = definition;
      } else if (typeof definition === 'object') {
        definitionString = JSON.stringify(definition);
      } else {
        return NextResponse.json(
          { error: 'Definition must be a valid JSON object or string', code: 'INVALID_DEFINITION_JSON' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Definition must be valid JSON', code: 'INVALID_DEFINITION_JSON' },
        { status: 400 }
      );
    }

    // Get the next version number
    const existingVersions = await db
      .select()
      .from(modelVersions)
      .where(eq(modelVersions.modelDefinitionId, parsedModelDefinitionId))
      .orderBy(desc(modelVersions.version))
      .limit(1);

    const nextVersion = existingVersions.length === 0 ? 1 : existingVersions[0].version + 1;

    // Insert new version
    const newVersion = await db
      .insert(modelVersions)
      .values({
        modelDefinitionId: parsedModelDefinitionId,
        version: nextVersion,
        definition: definitionString,
        changeDescription: changeDescription.trim(),
        createdBy: parsedCreatedBy,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Parse definition back to object for response
    const responseVersion = {
      ...newVersion[0],
      definition: JSON.parse(newVersion[0].definition),
    };

    return NextResponse.json(responseVersion, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}