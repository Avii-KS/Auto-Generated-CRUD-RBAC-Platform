import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getModel, validateModelData } from '@/lib/models';
import { canPerformAction, checkOwnership } from '@/lib/rbac';
import { getRecordById, updateRecord, deleteRecord } from '@/lib/dataStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { modelName, id } = await params;
    const model = getModel(modelName);
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Check read permission
    if (!canPerformAction(user.role, 'read', model.permissions)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const record = getRecordById(modelName, id);
    
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (model.ownerField) {
      const ownerId = record[model.ownerField];
      if (!checkOwnership(user.id, ownerId, user.role)) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { modelName, id } = await params;
    const model = getModel(modelName);
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Check update permission
    if (!canPerformAction(user.role, 'update', model.permissions)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const existingRecord = getRecordById(modelName, id);
    
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (model.ownerField) {
      const ownerId = existingRecord[model.ownerField];
      if (!checkOwnership(user.id, ownerId, user.role)) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    const data = await request.json();
    
    // Validate data
    const errors = validateModelData({ ...existingRecord, ...data }, model);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }
    
    // Don't allow changing owner
    if (model.ownerField && data[model.ownerField]) {
      delete data[model.ownerField];
    }
    
    const record = updateRecord(modelName, id, data);
    
    return NextResponse.json({ record });
  } catch (error) {
    console.error('Update record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string; id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { modelName, id } = await params;
    const model = getModel(modelName);
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Check delete permission
    if (!canPerformAction(user.role, 'delete', model.permissions)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const existingRecord = getRecordById(modelName, id);
    
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (model.ownerField) {
      const ownerId = existingRecord[model.ownerField];
      if (!checkOwnership(user.id, ownerId, user.role)) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }
    
    const deleted = deleteRecord(modelName, id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete record' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
