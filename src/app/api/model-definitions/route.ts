import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { modelDefinitions, users, modelVersions } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const modelDef = await db.select({
        id: modelDefinitions.id,
        name: modelDefinitions.name,
        tableName: modelDefinitions.tableName,
        fields: modelDefinitions.fields,
        ownerField: modelDefinitions.ownerField,
        rbac: modelDefinitions.rbac,
        createdBy: modelDefinitions.createdBy,
        createdAt: modelDefinitions.createdAt,
        updatedAt: modelDefinitions.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
        .from(modelDefinitions)
        .leftJoin(users, eq(modelDefinitions.createdBy, users.id))
        .where(eq(modelDefinitions.id, parseInt(id)))
        .limit(1);

      if (modelDef.length === 0) {
        return NextResponse.json({ error: 'Model definition not found' }, { status: 404 });
      }

      const result = {
        ...modelDef[0],
        fields: JSON.parse(modelDef[0].fields),
        rbac: JSON.parse(modelDef[0].rbac),
      };

      return NextResponse.json(result, { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select({
      id: modelDefinitions.id,
      name: modelDefinitions.name,
      tableName: modelDefinitions.tableName,
      fields: modelDefinitions.fields,
      ownerField: modelDefinitions.ownerField,
      rbac: modelDefinitions.rbac,
      createdBy: modelDefinitions.createdBy,
      createdAt: modelDefinitions.createdAt,
      updatedAt: modelDefinitions.updatedAt,
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
      .from(modelDefinitions)
      .leftJoin(users, eq(modelDefinitions.createdBy, users.id));

    if (search) {
      query = query.where(like(modelDefinitions.name, `%${search}%`));
    }

    const results = await query.limit(limit).offset(offset);

    const parsedResults = results.map(result => ({
      ...result,
      fields: JSON.parse(result.fields),
      rbac: JSON.parse(result.rbac),
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
    const { name, tableName, fields, ownerField, rbac, createdBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!tableName || !tableName.trim()) {
      return NextResponse.json({ 
        error: "Table name is required",
        code: "MISSING_TABLE_NAME" 
      }, { status: 400 });
    }

    if (!fields) {
      return NextResponse.json({ 
        error: "Fields are required",
        code: "MISSING_FIELDS" 
      }, { status: 400 });
    }

    if (!rbac) {
      return NextResponse.json({ 
        error: "RBAC configuration is required",
        code: "MISSING_RBAC" 
      }, { status: 400 });
    }

    if (!createdBy || isNaN(parseInt(createdBy))) {
      return NextResponse.json({ 
        error: "Valid createdBy user ID is required",
        code: "INVALID_CREATED_BY" 
      }, { status: 400 });
    }

    const existingName = await db.select()
      .from(modelDefinitions)
      .where(eq(modelDefinitions.name, name.trim()))
      .limit(1);

    if (existingName.length > 0) {
      return NextResponse.json({ 
        error: "Model definition with this name already exists",
        code: "DUPLICATE_NAME" 
      }, { status: 400 });
    }

    const existingTableName = await db.select()
      .from(modelDefinitions)
      .where(eq(modelDefinitions.tableName, tableName.trim()))
      .limit(1);

    if (existingTableName.length > 0) {
      return NextResponse.json({ 
        error: "Model definition with this table name already exists",
        code: "DUPLICATE_TABLE_NAME" 
      }, { status: 400 });
    }

    const creatorExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(createdBy)))
      .limit(1);

    if (creatorExists.length === 0) {
      return NextResponse.json({ 
        error: "Creator user does not exist",
        code: "INVALID_CREATOR" 
      }, { status: 400 });
    }

    let fieldsString: string;
    try {
      fieldsString = typeof fields === 'string' ? fields : JSON.stringify(fields);
      JSON.parse(fieldsString);
    } catch (error) {
      return NextResponse.json({ 
        error: "Fields must be valid JSON",
        code: "INVALID_FIELDS_JSON" 
      }, { status: 400 });
    }

    let rbacString: string;
    try {
      rbacString = typeof rbac === 'string' ? rbac : JSON.stringify(rbac);
      JSON.parse(rbacString);
    } catch (error) {
      return NextResponse.json({ 
        error: "RBAC must be valid JSON",
        code: "INVALID_RBAC_JSON" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    
    const newModelDef = await db.insert(modelDefinitions)
      .values({
        name: name.trim(),
        tableName: tableName.trim(),
        fields: fieldsString,
        ownerField: ownerField?.trim() || null,
        rbac: rbacString,
        createdBy: parseInt(createdBy),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const result = {
      ...newModelDef[0],
      fields: JSON.parse(newModelDef[0].fields),
      rbac: JSON.parse(newModelDef[0].rbac),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    const existing = await db.select()
      .from(modelDefinitions)
      .where(eq(modelDefinitions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Model definition not found' }, { status: 404 });
    }

    const { name, tableName, fields, ownerField, rbac, updatedBy } = body;

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }

      if (name.trim() !== existing[0].name) {
        const duplicateName = await db.select()
          .from(modelDefinitions)
          .where(eq(modelDefinitions.name, name.trim()))
          .limit(1);

        if (duplicateName.length > 0 && duplicateName[0].id !== parseInt(id)) {
          return NextResponse.json({ 
            error: "Model definition with this name already exists",
            code: "DUPLICATE_NAME" 
          }, { status: 400 });
        }
      }
    }

    if (tableName !== undefined) {
      if (!tableName || !tableName.trim()) {
        return NextResponse.json({ 
          error: "Table name cannot be empty",
          code: "INVALID_TABLE_NAME" 
        }, { status: 400 });
      }

      if (tableName.trim() !== existing[0].tableName) {
        const duplicateTableName = await db.select()
          .from(modelDefinitions)
          .where(eq(modelDefinitions.tableName, tableName.trim()))
          .limit(1);

        if (duplicateTableName.length > 0 && duplicateTableName[0].id !== parseInt(id)) {
          return NextResponse.json({ 
            error: "Model definition with this table name already exists",
            code: "DUPLICATE_TABLE_NAME" 
          }, { status: 400 });
        }
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (tableName !== undefined) {
      updates.tableName = tableName.trim();
    }

    if (fields !== undefined) {
      let fieldsString: string;
      try {
        fieldsString = typeof fields === 'string' ? fields : JSON.stringify(fields);
        JSON.parse(fieldsString);
        updates.fields = fieldsString;
      } catch (error) {
        return NextResponse.json({ 
          error: "Fields must be valid JSON",
          code: "INVALID_FIELDS_JSON" 
        }, { status: 400 });
      }
    }

    if (ownerField !== undefined) {
      updates.ownerField = ownerField?.trim() || null;
    }

    if (rbac !== undefined) {
      let rbacString: string;
      try {
        rbacString = typeof rbac === 'string' ? rbac : JSON.stringify(rbac);
        JSON.parse(rbacString);
        updates.rbac = rbacString;
      } catch (error) {
        return NextResponse.json({ 
          error: "RBAC must be valid JSON",
          code: "INVALID_RBAC_JSON" 
        }, { status: 400 });
      }
    }

    const updated = await db.update(modelDefinitions)
      .set(updates)
      .where(eq(modelDefinitions.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Model definition not found' }, { status: 404 });
    }

    // Create a new version entry for this update
    const changeDescription = body.changeDescription || 'Model definition updated';
    const createdByUserId = updatedBy || existing[0].createdBy; // Use updatedBy if provided, otherwise use original creator

    // Get the next version number
    const existingVersions = await db
      .select()
      .from(modelVersions)
      .where(eq(modelVersions.modelDefinitionId, parseInt(id)))
      .orderBy(desc(modelVersions.version))
      .limit(1);

    const nextVersion = existingVersions.length === 0 ? 1 : existingVersions[0].version + 1;

    // Create snapshot of the updated model definition
    const definitionSnapshot = {
      name: updated[0].name,
      tableName: updated[0].tableName,
      fields: JSON.parse(updated[0].fields),
      ownerField: updated[0].ownerField,
      rbac: JSON.parse(updated[0].rbac),
    };

    await db.insert(modelVersions).values({
      modelDefinitionId: parseInt(id),
      version: nextVersion,
      definition: JSON.stringify(definitionSnapshot),
      changeDescription: changeDescription,
      createdBy: createdByUserId,
      createdAt: new Date().toISOString(),
    });

    const result = {
      ...updated[0],
      fields: JSON.parse(updated[0].fields),
      rbac: JSON.parse(updated[0].rbac),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(modelDefinitions)
      .where(eq(modelDefinitions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Model definition not found' }, { status: 404 });
    }

    const deleted = await db.delete(modelDefinitions)
      .where(eq(modelDefinitions.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Model definition not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Model definition deleted successfully',
      deleted: {
        ...deleted[0],
        fields: JSON.parse(deleted[0].fields),
        rbac: JSON.parse(deleted[0].rbac),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}