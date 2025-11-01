import { UserRole } from './auth';
import { RBACRule } from './rbac';

/**
 * Supported field types for model definitions
 * - string: Text values
 * - number: Numeric values (integer or decimal)
 * - boolean: True/false values
 * - date: Date values (ISO 8601 format)
 * - email: Email address with validation
 * - url: URL with validation
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';

/**
 * Validation rules that can be applied to model fields
 */
export interface FieldValidation {
  /** Whether the field is required (cannot be null/undefined/empty) */
  required?: boolean;
  /** Minimum value for numbers or minimum date */
  min?: number;
  /** Maximum value for numbers or maximum date */
  max?: number;
  /** Regular expression pattern for string validation */
  pattern?: string;
  /** Minimum length for string fields */
  minLength?: number;
  /** Maximum length for string fields */
  maxLength?: number;
}

/**
 * Represents a single field in a model definition
 */
export interface ModelField {
  /** Unique field name (used as key in data records) */
  name: string;
  /** Data type of the field */
  type: FieldType;
  /** Optional validation rules for the field */
  validation?: FieldValidation;
  /** Human-readable label for UI display */
  label?: string;
  /** Whether this is a required field (deprecated - use validation.required) */
  required?: boolean;
}

/**
 * Legacy Model interface for backward compatibility
 * @deprecated Use ModelDefinition instead
 */
export interface Model {
  name: string;
  fields: ModelField[];
  ownerField?: string;
  permissions?: RBACRule;
}

/**
 * Complete model definition with metadata
 * This represents the schema for a data entity in the system
 */
export interface ModelDefinition {
  /** Unique model name (PascalCase recommended, e.g., "Product", "Employee") */
  name: string;
  /** Array of field definitions for this model */
  fields: ModelField[];
  /** Optional field name that stores the owner's user ID for row-level security */
  ownerField?: string;
  /** RBAC permissions defining who can perform which operations */
  permissions: RBACRule;
  /** ISO timestamp when the model was created */
  createdAt: string;
  /** ISO timestamp when the model was last updated */
  updatedAt: string;
}

/**
 * In-memory storage for model definitions
 * Note: In production, models should be persisted to:
 * - File system (JSON files in /models directory)
 * - Database (model_definitions table)
 * - External configuration service
 */
const models = new Map<string, ModelDefinition>();

/**
 * Save or update a model definition in memory
 * @param model The model definition to save
 * @throws Error if model name is empty or invalid
 */
export function saveModel(model: ModelDefinition): void {
  if (!model.name || model.name.trim() === '') {
    throw new Error('Model name cannot be empty');
  }
  models.set(model.name, model);
}

/**
 * Retrieve a model definition by name
 * @param name The name of the model to retrieve
 * @returns The model definition, or undefined if not found
 */
export function getModel(name: string): ModelDefinition | undefined {
  return models.get(name);
}

/**
 * Get all registered model definitions
 * @returns Array of all model definitions
 */
export function getAllModels(): ModelDefinition[] {
  return Array.from(models.values());
}

/**
 * Delete a model definition
 * @param name The name of the model to delete
 * @returns true if the model was deleted, false if it didn't exist
 */
export function deleteModel(name: string): boolean {
  return models.delete(name);
}

/**
 * Validate a single field value against its field definition
 * @param value The value to validate
 * @param field The field definition with validation rules
 * @returns Error message if validation fails, null if valid
 */
export function validateField(value: any, field: ModelField): string | null {
  const validation = field.validation || {};
  
  // Handle required field - support both locations for backward compatibility
  const isRequired = validation.required || field.required;
  
  // Check if value is empty
  const isEmpty = value === null || value === undefined || value === '';
  
  if (isRequired && isEmpty) {
    return `${field.label || field.name} is required`;
  }
  
  if (isEmpty) {
    return null; // Skip other validations if empty and not required
  }
  
  // Type-specific validations
  if (field.type === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      return `${field.label || field.name} must be a number`;
    }
    if (validation.min !== undefined && num < validation.min) {
      return `${field.label || field.name} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && num > validation.max) {
      return `${field.label || field.name} must be at most ${validation.max}`;
    }
  }
  
  if (field.type === 'string' || field.type === 'email' || field.type === 'url') {
    const str = String(value);
    if (validation.minLength !== undefined && str.length < validation.minLength) {
      return `${field.label || field.name} must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength !== undefined && str.length > validation.maxLength) {
      return `${field.label || field.name} must be at most ${validation.maxLength} characters`;
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(str)) {
        return `${field.label || field.name} format is invalid`;
      }
    }
  }
  
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      return `${field.label || field.name} must be a valid email`;
    }
  }
  
  if (field.type === 'url') {
    try {
      new URL(String(value));
    } catch {
      return `${field.label || field.name} must be a valid URL`;
    }
  }
  
  if (field.type === 'date') {
    const dateValue = new Date(String(value));
    if (isNaN(dateValue.getTime())) {
      return `${field.label || field.name} must be a valid date`;
    }
  }
  
  if (field.type === 'boolean') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return `${field.label || field.name} must be a boolean value`;
    }
  }
  
  return null;
}

/**
 * Validate an entire data object against a model definition
 * @param data The data object to validate
 * @param model The model definition with field rules
 * @returns Object mapping field names to error messages (empty if all valid)
 */
export function validateModelData(data: any, model: ModelDefinition | Model): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const field of model.fields) {
    const error = validateField(data[field.name], field);
    if (error) {
      errors[field.name] = error;
    }
  }
  
  return errors;
}