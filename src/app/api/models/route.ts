import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllModels, saveModel, ModelDefinition } from '@/lib/models';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const models = getAllModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only admins can create models' },
        { status: 403 }
      );
    }
    
    const modelData = await request.json();
    
    // Validate model data
    if (!modelData.name || !modelData.fields || !Array.isArray(modelData.fields)) {
      return NextResponse.json(
        { error: 'Invalid model data' },
        { status: 400 }
      );
    }
    
    const model: ModelDefinition = {
      name: modelData.name,
      fields: modelData.fields,
      ownerField: modelData.ownerField,
      permissions: modelData.permissions || {
        create: ['Admin'],
        read: ['Admin', 'Manager', 'Viewer'],
        update: ['Admin'],
        delete: ['Admin'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    saveModel(model);
    
    return NextResponse.json({ model });
  } catch (error) {
    console.error('Create model error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
