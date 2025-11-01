import { UserRole } from './auth';

/**
 * RBAC (Role-Based Access Control) rule defining permissions for CRUD operations
 * Each action can specify which roles are allowed to perform it
 */
export interface RBACRule {
  /** Roles allowed to create new records */
  create?: UserRole[];
  /** Roles allowed to read/view records */
  read?: UserRole[];
  /** Roles allowed to update existing records */
  update?: UserRole[];
  /** Roles allowed to delete records */
  delete?: UserRole[];
}

/**
 * Collection of RBAC rules for multiple models
 * Key: model name, Value: RBAC rule for that model
 */
export interface ModelPermissions {
  [key: string]: RBACRule;
}

/**
 * Check if a user role has permission to perform a specific action
 * 
 * @param userRole The role of the user attempting the action
 * @param action The CRUD action being attempted (create/read/update/delete)
 * @param permissions Optional RBAC rule defining allowed roles per action
 * @returns true if the user has permission, false otherwise
 * 
 * @remarks
 * - If no permissions are specified, only Admins are allowed (secure by default)
 * - If an action is not defined in permissions, only Admins are allowed
 * - Always returns true for Admin role (they have full access)
 * 
 * @example
 * ```typescript
 * const permissions = {
 *   create: ['Admin', 'Manager'],
 *   read: ['Admin', 'Manager', 'Viewer']
 * };
 * 
 * canPerformAction('Manager', 'create', permissions); // true
 * canPerformAction('Viewer', 'create', permissions);  // false
 * canPerformAction('Admin', 'delete', permissions);   // true (no delete rule, Admin allowed)
 * ```
 */
export function canPerformAction(
  userRole: UserRole,
  action: 'create' | 'read' | 'update' | 'delete',
  permissions?: RBACRule
): boolean {
  // If no permissions specified, default to Admin-only (secure by default)
  if (!permissions || !permissions[action]) {
    return userRole === 'Admin';
  }
  
  const allowedRoles = permissions[action] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user has ownership access to a record
 * 
 * @param userId The ID of the user attempting access
 * @param ownerId The ID of the record owner (from the ownerField)
 * @param userRole The role of the user attempting access
 * @returns true if the user can access the record, false otherwise
 * 
 * @remarks
 * - Admins can access all records regardless of ownership
 * - If no ownerId is set (undefined), all users can access (public record)
 * - Non-admin users can only access records they own (userId === ownerId)
 * 
 * @example
 * ```typescript
 * // Admin accessing any record
 * checkOwnership('admin-123', 'user-456', 'Admin'); // true
 * 
 * // Manager accessing their own record
 * checkOwnership('manager-123', 'manager-123', 'Manager'); // true
 * 
 * // Manager accessing someone else's record
 * checkOwnership('manager-123', 'user-456', 'Manager'); // false
 * 
 * // Anyone accessing a public record (no owner)
 * checkOwnership('user-123', undefined, 'Viewer'); // true
 * ```
 */
export function checkOwnership(
  userId: string,
  ownerId: string | undefined,
  userRole: UserRole
): boolean {
  // Admins can access everything
  if (userRole === 'Admin') {
    return true;
  }
  
  // If no owner field, allow based on role (public record)
  if (!ownerId) {
    return true;
  }
  
  // Check ownership: user can only access their own records
  return userId === ownerId;
}