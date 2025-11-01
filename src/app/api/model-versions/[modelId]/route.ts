import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { modelVersions, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params;

    // Validate modelId is a valid integer
    if (!modelId || isNaN(parseInt(modelId))) {
      return NextResponse.json(
        {
          error: 'Valid model ID is required',
          code: 'INVALID_MODEL_ID',
        },
        { status: 400 }
      );
    }

    const modelDefinitionId = parseInt(modelId);

    // Query modelVersions with user information
    const versions = await db
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
      .where(eq(modelVersions.modelDefinitionId, modelDefinitionId))
      .orderBy(desc(modelVersions.version));

    // Return 404 if no versions found
    if (versions.length === 0) {
      return NextResponse.json(
        {
          error: 'No versions found for this model',
          code: 'NO_VERSIONS_FOUND',
        },
        { status: 404 }
      );
    }

    // Transform the results to include creator object and parse definition JSON
    const formattedVersions = versions.map((version) => ({
      id: version.id,
      modelDefinitionId: version.modelDefinitionId,
      version: version.version,
      definition: JSON.parse(version.definition),
      changeDescription: version.changeDescription,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      creator: {
        id: version.creatorId,
        name: version.creatorName,
        email: version.creatorEmail,
      },
    }));

    return NextResponse.json(formattedVersions, { status: 200 });
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