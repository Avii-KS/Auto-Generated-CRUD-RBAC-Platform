import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getModel, validateModelData } from '@/lib/models';
import { canPerformAction } from '@/lib/rbac';
import { getModelData, createRecord } from '@/lib/dataStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { modelName } = await params;
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
    
    const data = getModelData(modelName);
    
    // Filter by ownership if ownerField is defined
    let filteredData = data;
    if (model.ownerField && user.role !== 'Admin') {
      filteredData = data.filter((record) => {
        const ownerId = record[model.ownerField!];
        return !ownerId || ownerId === user.id;
      });
    }
    
    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelName: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { modelName } = await params;
    const model = getModel(modelName);
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Check create permission
    if (!canPerformAction(user.role, 'create', model.permissions)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate data
    const errors = validateModelData(data, model);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }
    
    // Set owner field if defined
    if (model.ownerField) {
      data[model.ownerField] = user.id;
    }
    
    const record = createRecord(modelName, data);
    
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Create data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
