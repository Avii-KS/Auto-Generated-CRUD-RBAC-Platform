import { describe, it, expect } from 'vitest';
import { canPerformAction, checkOwnership } from '@/lib/rbac';
import type { UserRole } from '@/lib/auth';

describe('RBAC - canPerformAction', () => {
  describe('with explicit permissions', () => {
    const permissions = {
      create: ['Admin', 'Manager'] as UserRole[],
      read: ['Admin', 'Manager', 'Viewer'] as UserRole[],
      update: ['Admin', 'Manager'] as UserRole[],
      delete: ['Admin'] as UserRole[],
    };

    it('should allow Admin to create', () => {
      expect(canPerformAction('Admin', 'create', permissions)).toBe(true);
    });

    it('should allow Manager to create', () => {
      expect(canPerformAction('Manager', 'create', permissions)).toBe(true);
    });

    it('should deny Viewer to create', () => {
      expect(canPerformAction('Viewer', 'create', permissions)).toBe(false);
    });

    it('should allow all roles to read', () => {
      expect(canPerformAction('Admin', 'read', permissions)).toBe(true);
      expect(canPerformAction('Manager', 'read', permissions)).toBe(true);
      expect(canPerformAction('Viewer', 'read', permissions)).toBe(true);
    });

    it('should allow Admin and Manager to update', () => {
      expect(canPerformAction('Admin', 'update', permissions)).toBe(true);
      expect(canPerformAction('Manager', 'update', permissions)).toBe(true);
    });

    it('should deny Viewer to update', () => {
      expect(canPerformAction('Viewer', 'update', permissions)).toBe(false);
    });

    it('should only allow Admin to delete', () => {
      expect(canPerformAction('Admin', 'delete', permissions)).toBe(true);
      expect(canPerformAction('Manager', 'delete', permissions)).toBe(false);
      expect(canPerformAction('Viewer', 'delete', permissions)).toBe(false);
    });
  });

  describe('without permissions (defaults)', () => {
    it('should only allow Admin when no permissions specified', () => {
      expect(canPerformAction('Admin', 'create')).toBe(true);
      expect(canPerformAction('Manager', 'create')).toBe(false);
      expect(canPerformAction('Viewer', 'create')).toBe(false);
    });

    it('should only allow Admin for all actions when no permissions', () => {
      const actions: Array<'create' | 'read' | 'update' | 'delete'> = [
        'create',
        'read',
        'update',
        'delete',
      ];
      
      actions.forEach((action) => {
        expect(canPerformAction('Admin', action)).toBe(true);
        expect(canPerformAction('Manager', action)).toBe(false);
        expect(canPerformAction('Viewer', action)).toBe(false);
      });
    });
  });

  describe('with partial permissions', () => {
    it('should default to Admin-only for undefined actions', () => {
      const partialPermissions = {
        read: ['Admin', 'Manager', 'Viewer'] as UserRole[],
      };

      expect(canPerformAction('Admin', 'create', partialPermissions)).toBe(true);
      expect(canPerformAction('Manager', 'create', partialPermissions)).toBe(false);
      expect(canPerformAction('Viewer', 'read', partialPermissions)).toBe(true);
    });
  });
});

describe('RBAC - checkOwnership', () => {
  const adminId = 'admin-123';
  const managerId = 'manager-456';
  const userId = 'user-789';

  describe('Admin role', () => {
    it('should always return true for Admin regardless of ownership', () => {
      expect(checkOwnership(adminId, userId, 'Admin')).toBe(true);
      expect(checkOwnership(adminId, managerId, 'Admin')).toBe(true);
      expect(checkOwnership(adminId, adminId, 'Admin')).toBe(true);
    });

    it('should return true for Admin even when ownerId is undefined', () => {
      expect(checkOwnership(adminId, undefined, 'Admin')).toBe(true);
    });
  });

  describe('Manager role', () => {
    it('should return true when Manager is the owner', () => {
      expect(checkOwnership(managerId, managerId, 'Manager')).toBe(true);
    });

    it('should return false when Manager is not the owner', () => {
      expect(checkOwnership(managerId, userId, 'Manager')).toBe(false);
      expect(checkOwnership(managerId, adminId, 'Manager')).toBe(false);
    });

    it('should return true when ownerId is undefined', () => {
      expect(checkOwnership(managerId, undefined, 'Manager')).toBe(true);
    });
  });

  describe('Viewer role', () => {
    it('should return true when Viewer is the owner', () => {
      expect(checkOwnership(userId, userId, 'Viewer')).toBe(true);
    });

    it('should return false when Viewer is not the owner', () => {
      expect(checkOwnership(userId, managerId, 'Viewer')).toBe(false);
      expect(checkOwnership(userId, adminId, 'Viewer')).toBe(false);
    });

    it('should return true when ownerId is undefined', () => {
      expect(checkOwnership(userId, undefined, 'Viewer')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string ownerId', () => {
      expect(checkOwnership(userId, '', 'Viewer')).toBe(false);
      expect(checkOwnership('', '', 'Manager')).toBe(true);
    });

    it('should be case-sensitive for user IDs', () => {
      expect(checkOwnership('user-123', 'USER-123', 'Manager')).toBe(false);
      expect(checkOwnership('user-123', 'user-123', 'Manager')).toBe(true);
    });
  });
});
