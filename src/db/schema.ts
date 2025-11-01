import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table - stores user accounts with roles
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'Admin', 'Manager', 'Viewer'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Sessions table - stores user session tokens
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// Model definitions table - stores dynamic model schemas
export const modelDefinitions = sqliteTable('model_definitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  tableName: text('table_name').notNull().unique(),
  fields: text('fields').notNull(), // JSON string
  ownerField: text('owner_field'),
  rbac: text('rbac').notNull(), // JSON string
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Model versions table - tracks version history of model definitions
export const modelVersions = sqliteTable('model_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  modelDefinitionId: integer('model_definition_id').notNull().references(() => modelDefinitions.id),
  version: integer('version').notNull(),
  definition: text('definition').notNull(), // JSON string
  changeDescription: text('change_description').notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Audit logs table - tracks all CRUD operations on data records and model definitions
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // "CREATE", "UPDATE", "DELETE", "READ"
  entityType: text('entity_type').notNull(), // "model_definition", "data_record", "user"
  entityId: text('entity_id').notNull(),
  entityName: text('entity_name').notNull(),
  changes: text('changes').notNull(), // JSON string of before/after values
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
});