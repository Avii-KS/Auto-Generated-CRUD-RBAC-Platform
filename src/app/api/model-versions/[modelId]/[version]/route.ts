import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { modelVersions, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string; version: string } }
) {
  try {
    const { modelId, version } = params;

    // Validate modelId and version are valid integers
    const modelIdNum = parseInt(modelId);
    const versionNum = parseInt(version);

    if (isNaN(modelIdNum) || isNaN(versionNum)) {
      return NextResponse.json(
        {
          error: 'Model ID and version must be valid integers',
          code: 'INVALID_PARAMETERS',
        },
        { status: 400 }
      );
    }

    // Query modelVersions table with user join
    const result = await db
      .select({
        id: modelVersions.id,
        modelDefinitionId: modelVersions.modelDefinitionId,
        version: modelVersions.version,
        definition: modelVersions.definition,
        changeDescription: modelVersions.changeDescription,
        createdBy: modelVersions.createdBy,
        createdAt: modelVersions.createdAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(modelVersions)
      .leftJoin(users, eq(modelVersions.createdBy, users.id))
      .where(
        and(
          eq(modelVersions.modelDefinitionId, modelIdNum),
          eq(modelVersions.version, versionNum)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        {
          error: 'Version not found',
          code: 'VERSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const versionData = result[0];

    // Parse definition from JSON string to object
    let parsedDefinition;
    try {
      parsedDefinition = JSON.parse(versionData.definition);
    } catch (parseError) {
      console.error('JSON parse error for definition:', parseError);
      parsedDefinition = versionData.definition;
    }

    // Format response with creator information
    const response = {
      id: versionData.id,
      modelDefinitionId: versionData.modelDefinitionId,
      version: versionData.version,
      definition: parsedDefinition,
      changeDescription: versionData.changeDescription,
      createdBy: versionData.createdBy,
      createdAt: versionData.createdAt,
      creator: {
        id: versionData.creatorId,
        name: versionData.creatorName,
        email: versionData.creatorEmail,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}