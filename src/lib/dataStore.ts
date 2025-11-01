// In-memory data store for dynamic models
// In production, this would be replaced with a real database

interface DataRecord {
  id: string;
  [key: string]: any;
}

const dataStore = new Map<string, Map<string, DataRecord>>();

export function getModelData(modelName: string): DataRecord[] {
  const modelStore = dataStore.get(modelName);
  if (!modelStore) {
    return [];
  }
  return Array.from(modelStore.values());
}

export function getRecordById(modelName: string, id: string): DataRecord | undefined {
  const modelStore = dataStore.get(modelName);
  return modelStore?.get(id);
}

export function createRecord(modelName: string, data: Omit<DataRecord, 'id'>): DataRecord {
  let modelStore = dataStore.get(modelName);
  if (!modelStore) {
    modelStore = new Map();
    dataStore.set(modelName, modelStore);
  }
  
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  const record: DataRecord = { id, ...data };
  modelStore.set(id, record);
  
  return record;
}

export function updateRecord(modelName: string, id: string, data: Partial<DataRecord>): DataRecord | null {
  const modelStore = dataStore.get(modelName);
  if (!modelStore) {
    return null;
  }
  
  const existing = modelStore.get(id);
  if (!existing) {
    return null;
  }
  
  const updated = { ...existing, ...data, id }; // Ensure id doesn't change
  modelStore.set(id, updated);
  
  return updated;
}

export function deleteRecord(modelName: string, id: string): boolean {
  const modelStore = dataStore.get(modelName);
  if (!modelStore) {
    return false;
  }
  
  return modelStore.delete(id);
}
